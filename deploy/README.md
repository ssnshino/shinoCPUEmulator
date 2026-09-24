# deploy

Distribution/build output for SHINO-80.

## Rule

**Do not hand-edit generated HTML in this directory.**

The development source of truth is under `src/`.

Build:

```bash
npm run build
```

Current output:

```text
deploy/
└── one_page_shino80_v0.0.2_ui_foundation.html
```

This file is the standalone one-page artifact used for:

- smartphone local execution
- desktop browser review
- release candidate distribution
- manual QA

The generated artifact may be committed because the one-page HTML itself is a project deliverable, but fixes must be made in `src/` and regenerated.

Future releases may keep versioned standalone artifacts here. Do not turn `deploy/` into a second source tree.
