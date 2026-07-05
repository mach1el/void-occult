import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Không tìm thấy #root để khởi tạo ứng dụng");
}

createRoot(root).render(<App />);
