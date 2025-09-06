import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store.js'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Loginpage from './Loginpage.jsx'
import Signuppage from './Signuppage.jsx'

// In your main.jsx or index.jsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // This will always render your links
    children: [
      { path: "login", element: <Loginpage /> },
      { path: "signup", element: <Signuppage /> },
      
    ]
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
)