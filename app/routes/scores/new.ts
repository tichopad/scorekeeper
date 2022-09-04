import { json } from 'remix'
import type { LoaderFunction } from 'remix'

export const loader: LoaderFunction = ({ request }) => {
  return json({ success: true, request }, 200)
}
