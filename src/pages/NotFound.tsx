import { useLocation } from "react-router-dom";

// basic 404 page for when a route doesn't exist
function NotFound() {
  const loc = useLocation();

  // log the error to console
  console.log("Page not found at:", loc.pathname);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center p-10 bg-white shadow rounded">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-6">Sorry, we couldn't find that page.</p>
        <a href="/" className="text-blue-600 font-bold hover:underline">
          Go back to Home
        </a>
      </div>
    </div>
  );
}

export default NotFound;
