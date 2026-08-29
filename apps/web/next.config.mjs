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
  // The logos are ALSO committed to public/media and served straight off the
  // CDN. File tracing alone kept failing in production because the bundle
  // layout differs from a local build, and a logo is a static asset that has no
  // business going through a serverless function on every request anyway.
  //
  // Payload mints upload URLs as /api/media/file/<filename>, and those URLs are
  // baked into rendered HTML, so rewriting is what lets existing markup and the
  // admin panel keep working untouched while the bytes come from the edge.
  async rewrites() {
    return [{ source: '/api/media/file/:name', destination: '/media/:name' }]
  },
}

export default withPayload(nextConfig)
