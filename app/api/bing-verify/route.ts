export const dynamic = 'force-dynamic'

export function GET() {
  return new Response(
    '<?xml version="1.0"?>\n<users>\n\t<user>A8A090114D7C6DEB343B0DA6FF560CD8</user>\n</users>',
    { headers: { 'Content-Type': 'application/xml' } }
  )
}
