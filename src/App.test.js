import { render, screen } from "@testing-library/react";
import App from "./App";

test("loopiere is alive", () => {
  render(<App />);
  const linkElement = screen.getByText(/loopiere/i);
  expect(linkElement).toBeInTheDocument();
});
