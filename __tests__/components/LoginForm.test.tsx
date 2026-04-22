/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { LoginForm } from "@/components/auth/LoginForm"

jest.mock("next-auth/react", () => ({ signIn: jest.fn() }))
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it("shows error when fields are empty on submit", async () => {
    render(<LoginForm />)
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  })
})
