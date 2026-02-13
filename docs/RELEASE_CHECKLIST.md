# Release Checklist

Use this checklist before creating the first public tag.

## Product

- [ ] `README.md` quickstart is accurate and minimal.
- [ ] Timestamp click opens YouTube at exact moment from transcript and citations.
- [ ] `iPad Reader (.html)` export opens on iPad with clickable timestamps.
- [ ] API key privacy rule is visible in UI and docs.

## Security

- [ ] No API key persistence fields in backend settings schema.
- [ ] No API token written to disk/cache.
- [ ] No API token logging in routes/services.
- [ ] `.gitignore` excludes local/generated artifacts.

## Build and Run

- [ ] `conda env create -f capyap.yml` succeeds.
- [ ] `conda activate capyap`.
- [ ] `npm run build` succeeds.
- [ ] `capyap start` launches local app.

## Documentation

- [ ] `docs/README.md` points to architecture/dev/security docs.
- [ ] `docs/AGENTIC_SYSTEM_ARCHITECTURE.md` is current.
- [ ] `docs/DEVELOPMENT_GUIDE.md` is current.
- [ ] `docs/SECURITY_AND_PRIVACY.md` is current.

## Release Hygiene

- [ ] `git status` clean.
- [ ] Version number confirmed in `pyproject.toml`.
- [ ] Annotated tag created, for example:

```bash
git tag -a v0.1.0 -m "First public release"
git push origin v0.1.0
```
