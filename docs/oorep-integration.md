# OOREP Integration Notes

This project integrates **OOREP-compatible repertory search behavior** into the Next.js + MongoDB app instead of embedding the full OOREP Scala/PostgreSQL application into the same runtime.

## Why this approach

OOREP itself is a separate application:

- Scala / Play backend
- PostgreSQL database
- optional Docker deployment

This app is intentionally:

- Next.js
- TypeScript
- MongoDB / Mongoose

Mixing both stacks into one runtime would make the project harder to operate and would break the MongoDB-first architecture we already converted.

## What is integrated here

The local repertory engine now supports **OOREP-style query syntax**:

- wildcard search: `pain*`
- exclusion: `pain, -abdomen, -head`
- exact phrase search: `"dry cough"`
- combined phrase + wildcard search: `"heart palp*"`

Implementation:

- `src/lib/repertory-engine.ts`
- `src/components/homeopathy/local-remedy-search.tsx`

## What OOREP officially redistributes

According to the official OOREP FAQ and repository:

- the OOREP source code is open source
- the source-code package is accompanied by `kent-de`, `publicum`, and `boericke`
- not every repertory or materia medica visible on the public OOREP server is intended for redistribution

That means the safest path is:

1. use this app's local MongoDB models for your own redistributable dataset
2. import only sources you are comfortable redistributing
3. optionally run official OOREP beside this app if you want the original server experience

## Optional: run official OOREP beside this app

If you want the original OOREP application locally as a separate tool:

1. Clone the official repository:

```bash
git clone https://github.com/nondeterministic/oorep.git
```

2. Enter its docker folder:

```bash
cd oorep/docker
```

3. Start it:

```bash
docker-compose pull
docker-compose up
```

4. Open:

```text
http://localhost:9000
```

## Recommended architecture

Use this project as the main system for:

- doctor authentication
- patient records
- visits
- follow-ups
- appointments
- printable prescriptions
- analytics
- MongoDB storage

Use OOREP in one of two ways:

1. as a reference source for additional repertory content
2. as a separate local sidecar app you can open alongside this one

## Official references

- OOREP repository: https://github.com/nondeterministic/oorep
- OOREP FAQ: https://www.oorep.com/faq
