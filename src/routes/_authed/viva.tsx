import { createFileRoute } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/_authed/viva')({
  component: VivaPage,
})

function VivaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case EA-VIVA-001</CardTitle>
        <CardDescription>The spoken viva will appear here.</CardDescription>
      </CardHeader>
    </Card>
  )
}
