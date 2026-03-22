# Docs Site

This repository uses MkDocs to serve a browsable documentation site.

## Relevant Files

- [mkdocs.yml](/c:/Users/SMARTECHLATAM%20GERALD/Desktop/git3/heat-diffusion-lab/mkdocs.yml)
- [requirements-docs.txt](/c:/Users/SMARTECHLATAM%20GERALD/Desktop/git3/heat-diffusion-lab/requirements-docs.txt)
- [docs/index.md](/c:/Users/SMARTECHLATAM%20GERALD/Desktop/git3/heat-diffusion-lab/docs/index.md)

## Run Locally

```powershell
python -m pip install -r requirements-docs.txt
python -m mkdocs serve
```

Then open the local docs URL printed by MkDocs.

## Note

Python is only used for the documentation layer, not for the simulation architecture itself.
