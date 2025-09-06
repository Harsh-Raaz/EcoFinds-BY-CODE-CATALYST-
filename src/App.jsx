import { Link, Outlet } from 'react-router-dom'

function App() {
  return (
    <div>
      {/* Navigation Links */}
      <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
      </div>

      {/* This renders the current page content */}
      <Outlet />
    </div>
  )
}

export default App