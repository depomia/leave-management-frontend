    import React, { useReducer, useState, useEffect } from "react";
    import { Button } from "@/components/ui/button";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import {
      Card,
      CardContent,
      CardFooter,
      CardHeader,
      CardTitle,
    } from "@/components/ui/card";
    import DatePicker from "@/components/atomic-Components/CalendarPicker";
    import GetUsers from "@/components/atomic-Components/GetSimilarUsers";
    import newRequest from "@/utils/newRequest";
    import { Leave } from "@/types/types";
    import { X } from "lucide-react";

    const initialState: Leave = {
      applicant: "",
      department: "",
      role: "",
      fromDate: new Date(),
      toDate: new Date(),
      reason: "",
      substituteSuggestion: {
        suggestedUser: "",
        suggestion: "",
      },
      actualLeaveDays: 0,
    };

    const reducer = (state: Leave, action: { type: string; payload: any }) => {
      switch (action.type) {
        case "applicant":
          return { ...state, applicant: action.payload };
        case "department":
          return { ...state, department: action.payload };
        case "role":
          return { ...state, role: action.payload };
        case "fromDate":
          return { ...state, fromDate: action.payload };
        case "toDate":
          return { ...state, toDate: action.payload };
        case "reason":
          return { ...state, reason: action.payload };
        case "updateSubstituteSuggestion":
          return {
            ...state,
            substituteSuggestion: {
              ...state.substituteSuggestion,
              [action.payload.name]: action.payload.value,
            },
          };
        case "actualLeaveDays":
          return { ...state, actualLeaveDays: action.payload };
        default:
          return state;
      }
    };

    const CreateLeave = ({
      mode,
      onClose,
    }: {
      mode: "create" | "update";
      onClose: () => void;
    }) => {
      const [state, dispatch] = useReducer(reducer, initialState);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        // Populate applicant, department, and role from localStorage
        const applicant = localStorage.getItem("_id") || "";
        const department = localStorage.getItem("department") || "";
        const role = localStorage.getItem("role") || "";

        dispatch({ type: "applicant", payload: applicant });
        dispatch({ type: "department", payload: department });
        dispatch({ type: "role", payload: role });
      }, []);

      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        const { name, value } = e.target;

        if (name === "suggestedUser" || name === "suggestion") {
          dispatch({
            type: "updateSubstituteSuggestion",
            payload: { name, value },
          });
        } else {
          dispatch({ type: name, payload: value });
        }
      };

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
          const leaveData = {
            ...state,
            actualLeaveDays: Math.ceil(
              (state.toDate.getTime() - state.fromDate.getTime()) /
                (1000 * 3600 * 24)
            ),
          };

          if (mode === "create") {
            await newRequest.post("/leave/", leaveData);
            alert("Leave application created successfully!");
          } else {
            await newRequest.put(`/leave/${state.applicant}`, leaveData);
            alert("Leave application updated successfully!");
          }
        } catch (err) {
          console.error("Failed to process leave application:", err);
          setError("Failed to process leave application.");
        }
      };

      const handleSelectUser = (userId: string) => {
        dispatch({
          type: "updateSubstituteSuggestion",
          payload: { name: "suggestedUser", value: userId },
        });
      };

      return (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50">
          <Card
            className="max-w-md w-full rounded-2xl shadow-lg p-4 bg-white"
            style={{
              transition: "transform 0.2s, box-shadow 0.2s",
              transform: "scale(1)",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {mode === "create" ? "Create Leave Application" : "Update Leave Application"}
                </CardTitle>
                <Button
                  variant="link"
                  onClick={onClose}
                  className="absolute top-0 right-0 mt-2 mr-2 text-gray-500"
                >
                  <X />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reason */}
                <div>
                  <Label htmlFor="reason" className="block text-sm font-medium">
                    Reason for Leave
                  </Label>
                  <Textarea
                    placeholder="Type your reason here"
                    name="reason"
                    value={state.reason}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                {/* From Date */}
                <div>
                  <DatePicker
                    label="From Date"
                    name="fromDate"
                    selectedDate={state.fromDate}
                    onSelect={(date) =>
                      dispatch({ type: "fromDate", payload: date })
                    }
                  />
                </div>

                {/* To Date */}
                <div>
                  <DatePicker
                    label="To Date"
                    name="toDate"
                    selectedDate={state.toDate}
                    onSelect={(date) =>
                      dispatch({ type: "toDate", payload: date })
                    }
                  />
                </div>

                {/* Substitute Suggestion */}
                <div>
                  <Label htmlFor="substituteSuggestion" className="block text-sm font-medium">
                    Suggest a Substitute
                  </Label>
                  <GetUsers onSelectUser={handleSelectUser} />
                </div>

                {/* Substitute Suggestion Reason */}
                <div>
                  <Label htmlFor="suggestion" className="block text-sm font-medium">
                    Reason for Substitute Suggestion
                  </Label>
                  <Textarea
                    placeholder="Reason for substitute suggestion"
                    name="suggestion"
                    value={state.substituteSuggestion.suggestion}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-md shadow-md hover:bg-gray-700"
                >
                  {mode === "create" ? "Create" : "Update"}
                </Button>
              </CardFooter>
            </form>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </Card>
        </div>
      );
    };

    export default CreateLeave;
