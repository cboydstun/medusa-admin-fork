import {
  AdminPostOrdersOrderClaimsClaimFulfillmentsReq,
  AdminPostOrdersOrderFulfillmentsReq,
  AdminPostOrdersOrderSwapsSwapFulfillmentsReq,
  ClaimOrder,
  Order,
  Swap,
} from "@medusajs/medusa"
import {
  useAdminCreateFulfillment,
  useAdminFulfillClaim,
  useAdminFulfillSwap,
} from "medusa-react"
import React, { useState } from "react"
import Button from "../../../../components/fundamentals/button"
import Modal from "../../../../components/molecules/modal"
import Metadata, {
  MetadataField,
} from "../../../../components/organisms/metadata"
import useToaster from "../../../../hooks/use-toaster"
import { getErrorMessage } from "../../../../utils/error-messages"
import CreateFulfillmentItemsTable from "./item-table"

type CreateFulfillmentModalProps = {
  handleCancel: () => void
  address?: object
  email?: string
  orderToFulfill: Order | ClaimOrder | Swap
  orderId: string
}

const CreateFulfillmentModal: React.FC<CreateFulfillmentModalProps> = ({
  handleCancel,
  orderToFulfill,
  orderId,
}) => {
  const [toFulfill, setToFulfill] = useState<string[]>([])
  const [quantities, setQuantities] = useState({})
  const [noNotis, setNoNotis] = useState(false)
  const [metadata, setMetadata] = useState<MetadataField[]>([
    { key: "", value: "" },
  ])

  const items =
    "items" in orderToFulfill
      ? orderToFulfill.items
      : orderToFulfill.additional_items

  const createOrderFulfillment = useAdminCreateFulfillment(orderId)
  const createSwapFulfillment = useAdminFulfillSwap(orderId)
  const createClaimFulfillment = useAdminFulfillClaim(orderId)

  const toaster = useToaster()

  const createFulfillment = () => {
    const [type] = orderToFulfill.id.split("_")

    type actionType =
      | typeof createOrderFulfillment
      | typeof createSwapFulfillment
      | typeof createClaimFulfillment

    let action: actionType = createOrderFulfillment
    let successText = "Successfully fulfilled order"
    let requestObj

    const preparedMetadata = metadata.reduce((acc, next) => {
      if (next.key) {
        return {
          ...acc,
          [next.key]: next.value,
        }
      } else {
        return acc
      }
    }, {})

    switch (type) {
      case "swap":
        action = createSwapFulfillment
        successText = "Successfully fulfilled swap"
        requestObj = {
          metadata: preparedMetadata,
          no_notification: noNotis,
        } as AdminPostOrdersOrderSwapsSwapFulfillmentsReq
        break

      case "claim":
        action = createClaimFulfillment
        successText = "Successfully fulfilled claim"
        requestObj = {
          metadata: preparedMetadata,
          no_notification: noNotis,
        } as AdminPostOrdersOrderClaimsClaimFulfillmentsReq
        break

      default:
        requestObj = {
          metadata: preparedMetadata,
          no_notification: noNotis,
        } as AdminPostOrdersOrderFulfillmentsReq
        requestObj.items = toFulfill
          .map((itemId) => ({ item_id: itemId, quantity: quantities[itemId] }))
          .filter((t) => !!t)
        break
    }

    action.mutate(requestObj, {
      onSuccess: () => {
        toaster(successText, "success")
        handleCancel()
      },
      onError: (err) => toaster(getErrorMessage(err), "error"),
    })
  }

  return (
    <Modal handleClose={handleCancel}>
      <Modal.Body>
        <Modal.Header handleClose={handleCancel}>
          <span className="inter-xlarge-semibold">Create Fulfillment</span>
        </Modal.Header>
        <Modal.Content>
          <div className="flex flex-col">
            <span className="inter-base-semibold mb-2">Items</span>
            <CreateFulfillmentItemsTable
              items={items}
              toFulfill={toFulfill}
              setToFulfill={setToFulfill}
              quantities={quantities}
              setQuantities={setQuantities}
            />
            <div className="mt-4">
              <Metadata metadata={metadata} setMetadata={setMetadata} />
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex w-full h-8 justify-end">
            <Button
              variant="ghost"
              className="mr-2 w-32 text-small justify-center"
              size="large"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              size="large"
              className="w-32 text-small justify-center"
              variant="primary"
              disabled={!toFulfill?.length}
              onClick={createFulfillment}
            >
              Complete
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  )
}

export default CreateFulfillmentModal