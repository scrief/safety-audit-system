export function Navbar() {
    return (
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Safety Audit System</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Add user menu/profile here later */}
            </div>
          </div>
        </div>
      </nav>
    )
  }