import React, { useEffect, useState } from "react"
import useMedusa from "../../hooks/use-medusa"
import EditIcon from "../fundamentals/icons/edit-icon"
import RefreshIcon from "../fundamentals/icons/refresh-icon"
import TrashIcon from "../fundamentals/icons/trash-icon"
import StatusDot from "../fundamentals/status-dot"
import SidebarTeamMember from "../molecules/sidebar-team-member"
import Table from "../molecules/table"
import Medusa from "../../services/api"
import DeletePrompt from "../organisms/delete-prompt"
import EditUser from "../organisms/edit-user-modal"

type UserListElement = {
  entity: any
  entityType: string
  tableElement: JSX.Element
}

type UserTableProps = {
  users: any[]
  invites: any[]
  triggerRefetch: () => void
}

const getInviteStatus = invite => {
  return new Date(invite.expires_at) < new Date() ? "expired" : "pending"
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  invites,
  triggerRefetch,
}) => {
  const [elements, setElements] = useState<UserListElement[]>([])
  const [shownElements, setShownElements] = useState<UserListElement[]>([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState(null)
  const { toaster } = useMedusa("store")

  useEffect(() => {
    setElements([
      ...users.map((user, i) => ({
        entity: user,
        entityType: "user",
        tableElement: getUserTableRow(user, i),
      })),
      ...invites.map((invite, i) => ({
        entity: invite,
        entityType: "invite",
        tableElement: getInviteTableRow(invite, i),
      })),
    ])
  }, [users, invites])

  useEffect(() => {
    setShownElements(elements)
  }, [elements])

  const handleClose = () => {
    setDeleteUser(false)
    setSelectedUser(null)
    setSelectedInvite(null)
  }

  const getUserTableRow = (user, index) => {
    return (
      <Table.Row
        key={`user-${index}`}
        color={"inherit"}
        actions={[
          {
            label: "Edit User",
            onClick: () => setSelectedUser(user),
            icon: <EditIcon size={20} />,
          },
          {
            label: "Remove User",
            variant: "danger",
            onClick: () => {
              setDeleteUser(true)
              setSelectedUser(user)
            },
            icon: <TrashIcon size={20} />,
          },
        ]}
      >
        <Table.Cell>
          <SidebarTeamMember user={user} />
        </Table.Cell>
        <Table.Cell className="w-80">{user.email}</Table.Cell>
        <Table.Cell className="inter-small-semibold text-violet-60">
          {user.role.charAt(0).toUpperCase()}
          {user.role.slice(1)}
        </Table.Cell>
        <Table.Cell></Table.Cell>
      </Table.Row>
    )
  }

  const getInviteTableRow = (invite, index) => {
    return (
      <Table.Row
        key={`invite-${index}`}
        actions={[
          {
            label: "Resend Invitation",
            onClick: () => {
              Medusa.invites
                .resend(invite.id)
                .then(() => {
                  toaster("Invitiation link has been resent", "success")
                })
                .then(() => triggerRefetch())
            },
            icon: <RefreshIcon size={20} />,
          },
          {
            label: "Remove Invitation",
            variant: "danger",
            onClick: () => {
              setSelectedInvite(invite)
            },
            icon: <TrashIcon size={20} />,
          },
        ]}
      >
        <Table.Cell className="text-grey-40">
          <SidebarTeamMember user={{ email: invite.user_email }} />
        </Table.Cell>
        <Table.Cell className="text-grey-40 w-80">
          {invite.user_email}
        </Table.Cell>
        <Table.Cell></Table.Cell>
        <Table.Cell>
          {new Date(invite?.expires_at) < new Date() ? (
            <StatusDot title={"Expired"} variant={"danger"} />
          ) : (
            <StatusDot title={"Pending"} variant={"success"} />
          )}
        </Table.Cell>
      </Table.Row>
    )
  }

  const filteringOptions = [
    {
      title: "Team permissions",
      options: [
        {
          title: "All",
          count: elements.length,
          onClick: () => setShownElements(elements),
        },
        {
          title: "Member",
          count: elements.filter(
            e => e.entityType === "user" && e.entity.role === "member"
          ).length,
          onClick: () =>
            setShownElements(
              elements.filter(
                e => e.entityType === "user" && e.entity.role === "member"
              )
            ),
        },
        {
          title: "Admin",
          count: elements.filter(
            e => e.entityType === "user" && e.entity.role === "admin"
          ).length,
          onClick: () =>
            setShownElements(
              elements.filter(
                e => e.entityType === "user" && e.entity.role === "admin"
              )
            ),
        },
        {
          title: "No team permissions",
          count: elements.filter(e => e.entityType === "invite").length,
          onClick: () =>
            setShownElements(elements.filter(e => e.entityType === "invite")),
        },
      ],
    },
    {
      title: "Status",
      options: [
        {
          title: "All",
          count: elements.length,
          onClick: () => setShownElements(elements),
        },
        {
          title: "Active",
          count: elements.filter(e => e.entityType === "user").length,
          onClick: () =>
            setShownElements(elements.filter(e => e.entityType === "user")),
        },
        {
          title: "Pending",
          count: elements.filter(
            e =>
              e.entityType === "invite" &&
              getInviteStatus(e.entity) === "pending"
          ).length,
          onClick: () =>
            setShownElements(
              elements.filter(
                e =>
                  e.entityType === "invite" &&
                  getInviteStatus(e.entity) === "pending"
              )
            ),
        },
        {
          title: "Expired",
          count: elements.filter(
            e =>
              e.entityType === "invite" &&
              getInviteStatus(e.entity) === "expired"
          ).length,
          onClick: () =>
            setShownElements(
              elements.filter(
                e =>
                  e.entityType === "invite" &&
                  getInviteStatus(e.entity) === "expired"
              )
            ),
        },
      ],
    },
  ]

  const handleUserSearch = (term: string) => {
    setShownElements(
      elements.filter(
        e =>
          e.entity?.first_name?.includes(term) ||
          e.entity?.last_name?.includes(term) ||
          e.entity?.email?.includes(term) ||
          e.entity?.user_email?.includes(term)
      )
    )
  }

  return (
    <div className="w-full h-full overflow-y-scroll">
      <Table
        filteringOptions={filteringOptions}
        enableSearch
        handleSearch={handleUserSearch}
      >
        <Table.Head>
          <Table.HeadRow>
            <Table.HeadCell className="w-72">Name</Table.HeadCell>
            <Table.HeadCell className="w-80">Email</Table.HeadCell>
            <Table.HeadCell className="w-72">Team permissions</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
          </Table.HeadRow>
        </Table.Head>
        <Table.Body>{shownElements.map(e => e.tableElement)}</Table.Body>
      </Table>
      {selectedUser &&
        (deleteUser ? (
          <DeletePrompt
            text={"Are you sure you want to remove this user?"}
            heading={"Remove user"}
            onDelete={() =>
              Medusa.users.delete(selectedUser.id).then(() => {
                toaster("User has been revoved", "success")
                triggerRefetch()
              })
            }
            handleClose={handleClose}
          />
        ) : (
          <EditUser
            handleClose={handleClose}
            user={selectedUser}
            onSubmit={() => {
              toaster("User has been updated", "success")
              triggerRefetch()
            }}
          />
        ))}
      {selectedInvite && (
        <DeletePrompt
          text={"Are you sure you want to remove this invite?"}
          heading={"Remove invite"}
          onDelete={() =>
            Medusa.invites.delete(selectedInvite.id).then(() => {
              toaster("Invitiation has been revoved", "success")
              triggerRefetch()
            })
          }
          handleClose={handleClose}
        />
      )}
    </div>
  )
}

export default UserTable
