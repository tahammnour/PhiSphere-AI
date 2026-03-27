# Hackathon Submission Checklist

Use this checklist before final submission.

## Required by event rules

- [ ] Project page includes a short description
- [ ] Challenge selection is clearly stated
- [ ] Demo video is uploaded
- [ ] Slide deck (PowerPoint/PDF) is uploaded
- [ ] GitHub repository link is uploaded

## Judge-ready repository docs

- [ ] Root overview is clear in `README.md`
- [ ] Quick judging path exists in `JUDGES_GUIDE.md`
- [ ] Backend docs exist in `artifacts/api-server/README.md`
- [ ] Frontend docs exist in `artifacts/phisphere-ai/README.md`
- [ ] Route-by-route API guide exists in `artifacts/api-server/src/routes/README.md`
- [ ] Shared library map exists in `lib/README.md`
- [ ] Notebook guide exists in `notebooks/README.md`

## Demo reliability checks

- [ ] `pnpm install` works
- [ ] DB schema push works: `pnpm --filter @workspace/db run push`
- [ ] Backend runs: `pnpm --filter @workspace/api-server run dev`
- [ ] Frontend runs: `pnpm --filter @workspace/phisphere-ai run dev`
- [ ] At least one complete end-to-end run is verified

## Feature checks for scoring

- [ ] Performance: stream response and show metrics panel
- [ ] Innovation: show OpenML import and multimodal workflow
- [ ] Azure breadth: show service status and list all services used
- [ ] Responsible AI: show safety boundary response and audit log

## Assets to prepare

- [ ] Replace placeholder repo/demo links in presentation if needed
- [ ] Export final slides to PDF
- [ ] Keep backup local copy of video and deck

