"use client";

import * as React from "react";
import {
  GalleryVerticalEnd,
  UsersRound,
  Archive,
  Target,
  SquareTerminal,
  Copyright,
  PersonStanding
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  
} from "@/components/ui/sidebar";

const user = localStorage.getItem("user")?.toString().toUpperCase();
const role = localStorage.getItem("role")?.toString().toUpperCase();
const department = localStorage.getItem("department")?.toString().toUpperCase();


// This is sample data.
const data = {
  user: {
    name: user,
    email: role,
    avatar: PersonStanding,
  },
  teams: [
    {
      name: "Leave Management System",
      logo: Target,
      plan: "",
    },
  ],
  navMain: [
    {
      title: "User Management",
      url: "/admin",
      icon: UsersRound,
      isActive: true,
    },
    {
      title: "Department",
      url: "/department",
      icon: Archive,
      items: [
      ],
    },
  ],
};

const dataAdmin = {
  user: {
    name: user,
    email: role,
    avatar: PersonStanding,
  },
  teams: [
    {
      name: "Leave Management System",
      logo: GalleryVerticalEnd,
      plan: "",
    },
  ],
  navMain: [
    {
      title: "Leaves",
      url: "/user",
      icon: SquareTerminal,
      items: [
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const role = localStorage.getItem("role");
const user = role === "admin" ? data : dataAdmin;
  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader>
      <div className="mb-4">
        <TeamSwitcher teams={data.teams} />
      </div>
     <NavUser user={user.user} /> 
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={user.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex gap-2 pb-3 justify-start ml-2 ">

        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
