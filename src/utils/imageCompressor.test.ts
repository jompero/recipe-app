// jsdom has no canvas, so browser-image-compression is faked: it returns a JPEG of a chosen size.
// The real output is checked by hand on Pepperplate photos (US-2.3).
import imageCompression, { type Options } from "browser-image-compression";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  compressImage,
  FULL_IMAGE,
  ImageTooLargeError,
  QUALITY_STEPS,
  THUMBNAIL,
} from "./imageCompressor";

vi.mock("browser-image-compression", () => ({ default: vi.fn() }));
const compress = vi.mocked(imageCompression);

/** A data URL is "data:image/jpeg;base64," plus 4 characters for every 3 bytes. */
const PREFIX = "data:image/jpeg;base64,".length;
function bytesForDataUrlLength(chars: number): number {
  return Math.floor(((chars - PREFIX) / 4) * 3);
}

/** Fakes the library: the output size depends on the target size and the quality. */
function fakeOutput(sizeFor: (options: Options) => number) {
  compress.mockImplementation((_file, options) => {
    const size = sizeFor(options);
    return Promise.resolve(
      new File([new Uint8Array(size)], "out.jpg", { type: options.fileType ?? "" }),
    );
  });
}

const isFull = (options: Options) => options.maxWidthOrHeight === FULL_IMAGE.maxWidthOrHeight;
const photo = new File([new Uint8Array(10)], "Pasta.jpg", { type: "image/jpeg" });

beforeEach(() => {
  compress.mockReset();
});

describe("compressImage", () => {
  test("returns JPEG data URLs for the full image and the thumbnail", async () => {
    fakeOutput((o) => (isFull(o) ? 120_000 : 12_000));

    const { full, thumbnail } = await compressImage(photo);

    expect(full).toMatch(/^data:image\/jpeg;base64,/);
    expect(thumbnail).toMatch(/^data:image\/jpeg;base64,/);
    expect(full.length).toBe(PREFIX + 160_000);
    expect(thumbnail.length).toBe(PREFIX + 16_000);
  });

  test("asks for JPEG at the first quality step and the right size, with no maxSizeMB", async () => {
    fakeOutput(() => 1_000);

    await compressImage(photo);

    expect(compress).toHaveBeenCalledTimes(2);
    const [fullCall, thumbCall] = compress.mock.calls;
    expect(fullCall?.[0]).toBe(photo);
    expect(fullCall?.[1]).toMatchObject({
      maxWidthOrHeight: 1024,
      fileType: "image/jpeg",
      initialQuality: 0.8,
    });
    expect(thumbCall?.[1]).toMatchObject({
      maxWidthOrHeight: 320,
      fileType: "image/jpeg",
      initialQuality: 0.8,
    });
    // maxSizeMB would make the library shrink the resolution as well (see imageCompressor.ts).
    expect(fullCall?.[1].maxSizeMB).toBeUndefined();
    expect(thumbCall?.[1].maxSizeMB).toBeUndefined();
  });

  test("makes the thumbnail from the compressed full image, not the original", async () => {
    fakeOutput(() => 1_000);

    await compressImage(photo);

    const fullResult = (await compress.mock.results[0]?.value) as File;
    expect(compress.mock.calls[1]?.[0]).toBe(fullResult);
  });

  test("lowers the quality step by step until the full image fits under its cap", async () => {
    const overCap = bytesForDataUrlLength(FULL_IMAGE.maxChars) + 3;
    const atCap = bytesForDataUrlLength(FULL_IMAGE.maxChars);
    fakeOutput((o) => {
      if (!isFull(o)) return 1_000;
      return (o.initialQuality ?? 1) > 0.6 ? overCap : atCap;
    });

    const { full } = await compressImage(photo);

    const fullQualities = compress.mock.calls
      .filter(([, o]) => isFull(o))
      .map(([, o]) => o.initialQuality);
    expect(fullQualities).toEqual([0.8, 0.7, 0.6]);
    expect(full.length).toBeLessThanOrEqual(FULL_IMAGE.maxChars);
  });

  test("steps the thumbnail down against its own, smaller cap", async () => {
    const thumbOverCap = bytesForDataUrlLength(THUMBNAIL.maxChars) + 3;
    fakeOutput((o) => {
      if (isFull(o)) return thumbOverCap; // fine for the full image's cap
      return o.initialQuality === 0.8 ? thumbOverCap : 20_000;
    });

    await compressImage(photo);

    const qualities = compress.mock.calls.map(([, o]) => [o.maxWidthOrHeight, o.initialQuality]);
    expect(qualities).toEqual([
      [1024, 0.8],
      [320, 0.8],
      [320, 0.7],
    ]);
  });

  test("gives up with ImageTooLargeError after the lowest quality", async () => {
    fakeOutput((o) => (isFull(o) ? 2_000_000 : 1_000));

    await expect(compressImage(photo)).rejects.toThrow(ImageTooLargeError);
    expect(compress).toHaveBeenCalledTimes(QUALITY_STEPS.length);
    expect(compress.mock.calls.at(-1)?.[1].initialQuality).toBe(QUALITY_STEPS.at(-1));
  });

  test("names the file when it isn't an image", async () => {
    compress.mockRejectedValue(new Error("The file given is not an image"));

    await expect(compressImage(photo)).rejects.toThrow("Couldn't read Pasta.jpg as an image.");
  });

  test("keeps the caps inside Firestore's 1 MiB document limit", () => {
    expect(FULL_IMAGE.maxChars).toBeLessThan(1_048_576 - 10_000);
    expect(THUMBNAIL.maxChars).toBeLessThan(FULL_IMAGE.maxChars);
  });
});
