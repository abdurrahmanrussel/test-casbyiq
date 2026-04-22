/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { RegisterForm } from "@/components/auth/RegisterForm"

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))
jest.mock("next-auth/react", () => ({ signIn: jest.fn() }))

describe("RegisterForm", () => {
  it("renders all fields including role selector", () => {
    render(<RegisterForm />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByText("Agent")).toBeInTheDocument()
    expect(screen.getByText("Broker")).toBeInTheDocument()
  })
})
