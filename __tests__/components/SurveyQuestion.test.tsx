/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { SurveyQuestion } from "@/components/survey/SurveyQuestion"

const question = { id: "AUT_A1", text: "I perform better when I can decide how to approach my work." }

const baseProps = {
  question,
  answer: undefined as number | undefined,
  onAnswer: jest.fn(),
  error: false,
  onNext: jest.fn(),
  onPrev: jest.fn(),
  canGoPrev: false,
  current: 0,
  total: 5,
}

describe("SurveyQuestion", () => {
  it("renders question text", () => {
    render(<SurveyQuestion {...baseProps} />)
    expect(screen.getByText(/I perform better/i)).toBeInTheDocument()
  })

  it("shows error message when error=true", () => {
    render(<SurveyQuestion {...baseProps} error={true} />)
    expect(screen.getByText("This field is required.")).toBeInTheDocument()
  })

  it("calls onAnswer when a radio option is clicked", () => {
    const onAnswer = jest.fn()
    render(<SurveyQuestion {...baseProps} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText("4 - Agree"))
    expect(onAnswer).toHaveBeenCalledWith(4)
  })

  it("shows page counter", () => {
    render(<SurveyQuestion {...baseProps} current={2} total={5} />)
    expect(screen.getByText("3 of 5")).toBeInTheDocument()
  })
})
