"use client";
import "./LeaveView.css";
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import newRequest from "@/utils/newRequest";
import DeleteConfirmation from "../Misc-Pages/DeleteConfirmation";
import LeaveForm from "./LeaveForm";
import { useData } from "@/components/context/DataProvider";
import { useState, useEffect } from "react";
import { Badge } from "../../ui/badge";

export type LeaveRequest = {
  _id: string;
  applicant: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  };
  fromDate: string;
  toDate: string;
  reason: string;
  actualLeaveDays: number;
  substituteSuggestion: {
    suggestedUser: {
      _id: string;
      name: string;
    };
    suggestion: string;
  } | null;
  status: {
    hodApproval: { approved: boolean };
    principalApproval: { approved: boolean };
    isApproved: boolean;
  };
};

const LeaveView = () => {
  // State for the leave form and delete confirmation
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "update">("create");
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveRequest | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  
  // Get user info from localStorage
  const userId = localStorage.getItem("_id");
  const userRole = localStorage.getItem("role") || "";
  const userDepartment = localStorage.getItem("department");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    "applicant.email": window.innerWidth > 768,
    substituteSuggestion: window.innerWidth > 640,
  });
  const [rowSelection, setRowSelection] = useState({});

  // Update column visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      setColumnVisibility({
        "applicant.email": window.innerWidth > 768,
        substituteSuggestion: window.innerWidth > 640,
        reason: window.innerWidth > 480,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch leave requests
  const {
    data: leaves,
    isLoading,
    isError,
    refetch: refetchLeaves,
  } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => {
      const response = await newRequest.get("/leave");
      return response.data;
    },
  });

  // Access department data from context
  const { departments } = useData();

  // Get department name from ID
  const getDepartmentName = (departmentId: string) => {
    const department = departments?.find((dept) => dept._id.toString() === departmentId);
    return department ? department.name : "Unknown Department";
  };

  // Filter leaves based on user role
  const filteredLeaves = React.useMemo(() => {
    if (!leaves) return [];

    if (userRole === "teaching-staff" || userRole === "non-teaching-staff") {
      // Staff only see their own leaves
      return leaves.filter(
        (leave: LeaveRequest) => leave.applicant._id === userId
      );
    } else if (userRole === "hod") {
      // HODs see departmental leaves AND their own leaves
      return leaves.filter(
        (leave: LeaveRequest) => 
          leave.applicant.department === userDepartment ||
          leave.applicant._id === userId
      );
    } else if (userRole === "principal" || userRole === "director") {
      // Principal/Director see all leaves
      return leaves;
    } else {
      return [];
    }
  }, [leaves, userRole, userDepartment, userId]);

  // Toggle approval mutation
  const toggleApproval = useMutation({
    mutationFn: async ({
      id,
      role,
      isApproved,
    }: {
      id: string;
      role: "hod" | "principal";
      isApproved: boolean;
    }) => {
      const statusField = role === "hod" ? "hodApproval" : "principalApproval";

      // Get current leave to check both approvals
      const leaveResponse = await newRequest.get(`/leave/${id}`);
      const leaveData = leaveResponse.data;

      // Determine approval status after this update
      const hodApproved =
        role === "hod" ? isApproved : leaveData.status.hodApproval.approved;
      const principalApproved =
        role === "principal"
          ? isApproved
          : leaveData.status.principalApproval.approved;

      // Overall approval requires both HOD and Principal approval
      const overallApproved = hodApproved && principalApproved;

      return newRequest.put(`/leave/${id}`, {
        [`status.${statusField}.approved`]: isApproved,
        "status.isApproved": overallApproved,
      });
    },
    onSuccess: () => {
      refetchLeaves();
    },
  });

  // Delete leave mutation
  const deleteLeave = useMutation({
    mutationFn: async (id: string) => {
      await newRequest.delete(`/leave/${id}`);
    },
    onSuccess: () => {
      refetchLeaves();
    },
  });

  // Check if user can approve as HOD
  const canApproveAsHOD = (leave: LeaveRequest) => {
    return userRole === "hod" && userDepartment === leave.applicant.department;
  };

  // Check if user can approve as Principal
  const canApproveAsPrincipal = () => {
    return userRole === "principal";
  };

  // Check overall approval status
  const getOverallStatus = (leave: LeaveRequest) => {
    return (
      leave.status.hodApproval.approved &&
      leave.status.principalApproval.approved
    );
  };

  // Open form for create/update
  const openForm = (mode: "create" | "update", leave?: LeaveRequest) => {
    setFormMode(mode);
    setLeaveToEdit(leave || null);
    setIsFormOpen(true);
  };

  // Handle leave deletion
  const handleConfirmDelete = async () => {
    if (!leaveToDelete) return;
    try {
      await deleteLeave.mutateAsync(leaveToDelete);
      alert("Leave deleted successfully");
    } catch (err) {
      console.error("Failed to delete leave:", err);
      alert("Failed to delete leave. Please try again.");
    } finally {
      setLeaveToDelete(null);
    }
  };

  // Close form and refresh data
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setLeaveToEdit(null);
    refetchLeaves();
  };

  // Create new leave
  const handleCreate = () => {
    setFormMode("create");
    setIsFormOpen(true);
  };

  // Table column definitions
  const columns: ColumnDef<LeaveRequest>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "applicant.name",
      header: "Name",
    },
    {
      accessorKey: "applicant.email",
      header: "Email",
      cell: ({ row }) => (
        <div
          className="max-w-[200px] truncate"
          title={row.original.applicant.email}
        >
          {row.original.applicant.email}
        </div>
      ),
    },
    {
      accessorKey: "applicant.role",
      header: "Role",
    },
    {
      accessorKey: "applicant.department",
      header: "Department",
      cell: ({ row }) => getDepartmentName(row.original.applicant.department),
    },
    {
      accessorKey: "fromDate",
      header: "From Date",
      cell: ({ row }) => new Date(row.original.fromDate).toLocaleDateString(),
    },
    {
      accessorKey: "toDate",
      header: "To Date",
      cell: ({ row }) => new Date(row.original.toDate).toLocaleDateString(),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.reason}>
          {row.original.reason}
        </div>
      ),
    },
    {
      accessorKey: "actualLeaveDays",
      header: "Days",
    },
    {
      accessorKey: "substituteSuggestion",
      header: "Substitute",
      cell: ({ row }) => {
        const substitute = row.original.substituteSuggestion;
        return substitute ? (
          <div className="p-2 max-w-[200px]">
            <p className="font-semibold">
              User: {substitute.suggestedUser?.name || "N/A"}
            </p>
            <p className="truncate" title={substitute.suggestion}>
              <span className="font-semibold">Note:</span>{" "}
              {substitute.suggestion}
            </p>
          </div>
        ) : (
          <em>No substitute</em>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={
            getOverallStatus(row.original) ? "bg-green-500" : "bg-yellow-500"
          }
        >
          {getOverallStatus(row.original) ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      id: "hodApproval",
      header: "HOD Approval",
      cell: ({ row }) =>
        canApproveAsHOD(row.original) ? (
          <Button
            variant={
              row.original.status.hodApproval.approved ? "outline" : "default"
            }
            onClick={() =>
              toggleApproval.mutate({
                id: row.original._id,
                role: "hod",
                isApproved: !row.original.status.hodApproval.approved,
              })
            }
            className="w-full"
          >
            {row.original.status.hodApproval.approved ? "Approved" : "Approve"}
          </Button>
        ) : (
          <Badge
            variant={
              row.original.status.hodApproval.approved ? "outline" : "secondary"
            }
          >
            {row.original.status.hodApproval.approved ? "Approved" : "Pending"}
          </Badge>
        ),
    },
    {
      id: "principalApproval",
      header: "Principal Approval",
      cell: ({ row }) =>
        canApproveAsPrincipal() ? (
          <Button
            variant={
              row.original.status.principalApproval.approved
                ? "outline"
                : "default"
            }
            onClick={() =>
              toggleApproval.mutate({
                id: row.original._id,
                role: "principal",
                isApproved: !row.original.status.principalApproval.approved,
              })
            }
            className="w-full"
          >
            {row.original.status.principalApproval.approved
              ? "Approved"
              : "Approve"}
          </Button>
        ) : (
          <Badge
            variant={
              row.original.status.principalApproval.approved
                ? "outline"
                : "secondary"
            }
          >
            {row.original.status.principalApproval.approved
              ? "Approved"
              : "Pending"}
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) =>
        // Allow teaching staff, non-teaching staff and HODs to manage their own leaves
        (userRole === "teaching-staff" || 
         userRole === "non-teaching-staff" || 
         userRole === "hod") &&
        row.original.applicant._id === userId && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => openForm("update", row.original)}
              className="w-full"
              size="sm"
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setLeaveToDelete(row.original._id)}
              className="w-full"
              size="sm"
            >
              Delete
            </Button>
          </div>
        ),
    },
  ];

  // Initialize table
  const table = useReactTable({
    data: filteredLeaves || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-lg">Loading leaves...</div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-red-500 text-center p-6">
        Error loading leave requests. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        {/* Header with create button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Leave Requests</h2>
          {/* Allow teaching staff, non-teaching staff and HODs to create leaves */}
          {(userRole === "teaching-staff" || 
            userRole === "non-teaching-staff" || 
            userRole === "hod") && (
            <Button 
              onClick={handleCreate}
              className="bg-black hover:bg-slate-800 text-white"
            >
              Create New Leave
            </Button>
          )}
        </div>
        
        {/* Table with scrollbar */}
        <div className="w-full overflow-hidden border rounded-lg shadow-sm">
          <div className="h-[500px] overflow-y-auto overflow-x-auto">
            <Table>
              {/* Sticky header */}
              <TableHeader className="bg-slate-50 sticky top-0 ">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        className="font-semibold text-gray-700 py-3"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : (
                            <div className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: " 🔼",
                                desc: " 🔽",
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              
              {/* Table body */}
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-slate-50 border-b"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500"
                    >
                      No leaves found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Row count display */}
        <div className="text-sm text-gray-500 mt-2">
          Showing {table.getFilteredRowModel().rows.length} records
        </div>
      </div>

      {/* Leave form modal */}
      {isFormOpen && (
        <div className="z-50">
          <LeaveForm
            mode={formMode}
            onClose={handleCloseForm}
            {...(formMode === "update" && leaveToEdit ? { leave: leaveToEdit } : {})}
          />
        </div>
      )}

      <DeleteConfirmation
        isOpen={!!leaveToDelete}
        onClose={() => setLeaveToDelete(null)}
        onConfirm={handleConfirmDelete}
        departmentName={""}
      />
    </>
  );
};

export default LeaveView;