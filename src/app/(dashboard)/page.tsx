import { Card } from '@/components/ui/Card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-medium mb-2">Recent Forms</h3>
          <p className="text-gray-600">No forms created yet</p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium mb-2">Recent Audits</h3>
          <p className="text-gray-600">No audits completed yet</p>
        </Card>

        <Card>
          <h3 className="text-lg font-medium mb-2">Statistics</h3>
          <p className="text-gray-600">No data available</p>
        </Card>
      </div>
    </div>
  )
}