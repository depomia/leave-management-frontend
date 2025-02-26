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
  getPaginationRowModel,
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

type User = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
};

const LeaveView = () => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"create" | "update">("create");
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveRequest | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);

  const userId = localStorage.getItem("_id");
  const userRole = localStorage.getItem("role") || "";
  const userDepartment = localStorage.getItem("department");

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

  // Filter leaves based on user role and userId
  const filteredLeaves = React.useMemo(() => {
    if (!leaves) return [];

    if (userRole === "teaching-staff" || userRole === "non-teaching-staff") {
      return leaves.filter(
        (leave: LeaveRequest) => leave.applicant._id === userId
      );
    } else if (userRole === "hod") {
      return leaves.filter(
        (leave: LeaveRequest) => leave.applicant.department === userDepartment
      );
    } else if (userRole === "principal" || userRole === "director") {
      return leaves;
    } else {
      return [];
    }
  }, [leaves, userRole, userDepartment, userId]);

  const { departments } = useData();

  const getDepartmentName = (dep: string) => {
    const department = departments?.find((dept) => dept._id.toString() === dep);
    return department ? department.name : "Unknown Department";
  };

  // Updated toggleApproval mutation that properly toggles the approval status and updates overall approval
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

      // Get current leave request to check both approvals for overall status update
      const leaveResponse = await newRequest.get(`/leave/${id}`);
      const leaveData = leaveResponse.data;

      // Determine if both approvals would be true after this update
      const hodApproved =
        role === "hod" ? isApproved : leaveData.status.hodApproval.approved;
      const principalApproved =
        role === "principal"
          ? isApproved
          : leaveData.status.principalApproval.approved;

      // Overall approval is true only if both hod and principal approve
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

  const deleteLeave = useMutation({
    mutationFn: async (id: string) => {
      await newRequest.delete(`/leave/${id}`);
    },
    onSuccess: () => {
      refetchLeaves();
    },
  });

  const openForm = (mode: "create" | "update", leave?: LeaveRequest) => {
    setFormMode(mode);
    setLeaveToEdit(leave || null);
    setIsFormOpen(true);
  };

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

  // Check if the current user can approve as HOD
  const canApproveAsHOD = (leave: LeaveRequest) => {
    return userRole === "hod" && userDepartment === leave.applicant.department;
  };

  // Check if the current user can approve as Principal
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
        (userRole === "teaching-staff" || userRole === "non-teaching-staff") &&
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

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      // Hide certain columns on mobile
      "applicant.email": window.innerWidth > 768,
      substituteSuggestion: window.innerWidth > 640,
    });
  const [rowSelection, setRowSelection] = React.useState({});

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

  const table = useReactTable({
    data: filteredLeaves || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setLeaveToEdit(null);
    refetchLeaves();
  };

  const handleCreate = () => {
    setFormMode("create");
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading leaves...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 text-center">
        Error loading leave requests. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Leave Requests</h2>
          {(userRole === "teaching-staff" ||
            userRole === "non-teaching-staff") && (
            <Button onClick={handleCreate}>Create New Leave</Button>
          )}
        </div>
       
<div className="w-full overflow-hidden border rounded-lg mb-6">
  <div className="h-[500px] overflow-y-auto overflow-x-auto">
    <Table>
      <TableHeader className="bg-slate-50 sticky top-0">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className="font-bold">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className="hover:bg-slate-50"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center"
            >
              No leaves found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <LeaveForm
          mode={formMode}
          onClose={handleCloseForm}
          {...(formMode === "update" && leaveToEdit
            ? { leave: leaveToEdit }
            : {})}
        />
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
