import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Payload serves uploads through /api/media/file/[filename], reading them off
  // disk from Media.upload.staticDir ("media"). That directory lives outside
  // .next, so Next's file tracing does not bundle it into the serverless
  // function and every logo returned a 500 in production while working locally.
  //
  // Tracing it into the Payload catch-all route fixes the read path. It does
  // NOT make uploads work: a serverless filesystem is read-only, so anything
  // added through the admin panel still needs an S3 or R2 storage adapter.
  // Key is a glob over Next's internal route names, which keep the (payload)
  // route group, so '/api/[...slug]' never matched. Tracing it onto every route
  // is the reliable form and costs 188KB, the total size of the 20 logos.
  outputFileTracingIncludes: {
    '/**/*': ['./media/**/*'],
  },

  // pnpm workspace: without this Next infers the trace root from the lockfile
  // at the repo root and resolves the glob above against the wrong directory.
  outputFileTracingRoot: import.meta.dirname,
}

export default withPayload(nextConfig)
