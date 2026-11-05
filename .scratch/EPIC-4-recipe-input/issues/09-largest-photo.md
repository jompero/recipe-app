# 09: Choose the largest site photo, not the first

Status: needs-triage
Story: US-4.3 (follow-up)
Spec: [../spec.md](../spec.md) (Converter)
Blocked by: none. Not part of a wave; pick it up after Epic 4's main work, or when photos come out small in practice.

## Problem

The converter (`src/import/jsonLd.ts`, issue 03) uses the first usable image URL. Sites often list a thumbnail first: Pinch of Yum lists a 225 px image before the full one, while WordPress/WPRM sites tend to list the full image first. A thumbnail gives a blurry full photo after compression.

## Idea

Among all image candidates (string, array, `ImageObject`s), prefer the largest:

- use `width`/`height` on `ImageObject`s when present;
- otherwise prefer URLs without size suffixes such as `-225x225` or `-150x150`, or with larger numbers in them;
- otherwise keep the first.

Unit tests from the existing fixtures (Pinch of Yum should pick its full image). This changes the converter only.

## Comments

**2026-11-05 (owner):** Left in the backlog (Epic 4 wrap-up). Pick it up if imported photos come out small in practice. BBC Good Food, the WordPress/WPRM sites and Valdemarsro list the full image first, and pasting a better image always works.
