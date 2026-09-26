# SHINO-80 CP/M and BASIC license research

2026-09-26

## Decision

The preferred future software stack is a license-audited CP/M-family system
plus R.T. Russell's Z80 BBC BASIC. No third-party source or binary is imported
by RAM handoff v0.5.

## CP/M

The older Computer History Museum early-source release is explicitly described
as non-commercial and is not the preferred redistribution basis.

CP/Mish records the later 2022 clarification from Bryan Sparks / DRDOS, Inc. as
granting a nonexclusive right to use, distribute, modify, enhance and otherwise
make available CP/M and derivatives. CP/Mish integrates CP/M-compatible pieces
with per-component licenses; its complete aggregate contains GPLv2 code and is
distributed under GPLv2.

Primary project/license records:

- <https://github.com/davidgiven/cpmish>
- <https://raw.githubusercontent.com/davidgiven/cpmish/master/third_party/dr/COPYING.md>
- <https://raw.githubusercontent.com/davidgiven/cpmish/master/COPYING.cpmish>

Before import, pin an exact revision and inventory every included component.
Do not assume that unrelated historical CP/M applications share the OS license.

## BASIC

CP/Mish contains R.T. Russell's Z80 BBC BASIC under the zlib license. Its notice
permits use for any purpose, including commercial applications, modification
and redistribution, provided origin is not misrepresented, altered sources are
marked, and the notice remains in source distributions.

License record:

- <https://raw.githubusercontent.com/davidgiven/cpmish/master/third_party/bbcbasic/COPYING>

This is preferred over Microsoft MBASIC, Altair BASIC and Nascom-derived images,
whose widespread availability does not itself establish redistribution rights.

## Integration rule

Keep third-party source, patches, notices and generated binaries visibly
separate from original SHINO-80 firmware. The future PR must include a precise
bill of materials, upstream revision, unmodified license texts, local patches,
reproducible build and distribution analysis before embedding anything in the
standalone HTML.

