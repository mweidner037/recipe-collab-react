import "./App.css";
import logo from "./assets/logo.svg";
import "./style.css";

import { Loader } from "./Loader";

export default function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Loader />
      </header>
    </div>
  );
}
