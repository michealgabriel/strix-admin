import { useSelector } from "react-redux";
import Admin from "./components/Admin";
import Login from "./components/Auth/Login";

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <div>
      {isAuthenticated ? <Admin /> : <Login />}
    </div>
  );
}

export default App;
