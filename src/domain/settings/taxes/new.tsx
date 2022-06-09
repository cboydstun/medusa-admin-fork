import { useAdminCreateTaxRate } from "medusa-react"
import React, { useContext } from "react"
import { useForm } from "react-hook-form"
import Button from "../../../components/fundamentals/button"
import PlusIcon from "../../../components/fundamentals/icons/plus-icon"
import Input from "../../../components/molecules/input"
import Modal from "../../../components/molecules/modal"
import LayeredModal, {
  LayeredModalContext,
} from "../../../components/molecules/modal/layered-modal"
import useNotification from "../../../hooks/use-notification"
import { getErrorMessage } from "../../../utils/error-messages"
import { TaxRuleItem } from "./tax-rule-item"
import TaxRuleSelector from "./tax-rule-selector"

type NewTaxRateProps = {
  regionId: string
  onDismiss: () => void
}

type NewTaxRateFormData = {
  code: string
  name: string
  rate: number
  shipping_options: string[]
  product_types: string[]
  products: string[]
}

const NewTaxRate = ({ regionId, onDismiss }: NewTaxRateProps) => {
  const createTaxRate = useAdminCreateTaxRate()
  const { register, setValue, handleSubmit, watch } = useForm<
    NewTaxRateFormData
  >({
    defaultValues: {
      products: [],
      product_types: [],
      shipping_options: [],
    },
  })
  const notification = useNotification()

  const layeredModalContext = useContext(LayeredModalContext)

  const onSave = (data: NewTaxRateFormData) => {
    createTaxRate.mutate(
      {
        ...data,
        region_id: regionId,
      },
      {
        onSuccess: () => {
          notification("Success", "Successfully created tax rate.", "success")
          onDismiss()
        },
        onError: (error) => {
          notification("Error", getErrorMessage(error), "error")
        },
      }
    )
  }

  const [products, product_types, shipping_options] = watch([
    "products",
    "product_types",
    "shipping_options",
  ])

  const handleOverridesSelected = (rule) => {
    switch (rule.type) {
      case "products":
        setValue("products", rule.items)
        break
      case "product_types":
        setValue("product_types", rule.items)
        break
      case "shipping_options":
        setValue("shipping_options", rule.items)
        break
      default:
        break
    }
  }

  return (
    <LayeredModal
      isLargeModal
      context={layeredModalContext}
      handleClose={onDismiss}
    >
      <form onSubmit={handleSubmit(onSave)}>
        <Modal.Body>
          <Modal.Header handleClose={onDismiss}>
            <div>
              <h1 className="inter-xlarge-semibold">Add Tax Rate</h1>
            </div>
          </Modal.Header>
          <Modal.Content>
            <div>
              <p className="inter-base-semibold mb-base">Details</p>
              <Input
                {...register("name", { required: true })}
                label="Name"
                placeholder="Rate name"
                className="mb-base min-w-[335px] w-full"
              />
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                {...register("rate", { min: 0, max: 100, required: true })}
                label="Rate"
                placeholder="12"
                className="mb-base min-w-[335px] w-full"
              />
              <Input
                placeholder="1000"
                {...register("code", { required: true })}
                label="Code"
                className="mb-base min-w-[335px] w-full"
              />
            </div>
            <div>
              <p className="inter-base-semibold mb-base">Overrides</p>
              {(product_types.length > 0 ||
                products.length > 0 ||
                shipping_options.length > 0) && (
                <div className="flex flex-col gap-base">
                  {products.length > 0 && (
                    <TaxRuleItem
                      onDelete={() =>
                        handleOverridesSelected({ type: "products", items: [] })
                      }
                      onEdit={() => {
                        layeredModalContext.push(
                          SelectOverridesScreen(
                            layeredModalContext.pop,
                            regionId,
                            handleOverridesSelected,
                            {
                              items: products,
                              type: "products",
                            }
                          )
                        )
                      }}
                      index={1}
                      name="Product Rules"
                      description={`Applies to ${products.length} product${
                        products.length > 1 ? "s" : ""
                      }`}
                    />
                  )}
                  {product_types.length > 0 && (
                    <TaxRuleItem
                      onDelete={() =>
                        handleOverridesSelected({
                          type: "product_types",
                          items: [],
                        })
                      }
                      onEdit={() => {
                        layeredModalContext.push(
                          SelectOverridesScreen(
                            layeredModalContext.pop,
                            regionId,
                            handleOverridesSelected,
                            {
                              items: product_types,
                              type: "product_types",
                            }
                          )
                        )
                      }}
                      index={2}
                      name="Product Type Rules"
                      description={`Applies to ${
                        product_types.length
                      } product type${product_types.length > 1 ? "s" : ""}`}
                    />
                  )}
                  {shipping_options.length > 0 && (
                    <TaxRuleItem
                      onDelete={() =>
                        handleOverridesSelected({
                          type: "shipping_options",
                          items: [],
                        })
                      }
                      onEdit={() => {
                        layeredModalContext.push(
                          SelectOverridesScreen(
                            layeredModalContext.pop,
                            regionId,
                            handleOverridesSelected,
                            {
                              items: shipping_options,
                              type: "shipping_options",
                            }
                          )
                        )
                      }}
                      index={3}
                      name="Shipping Option Rules"
                      description={`Applies to ${
                        shipping_options.length
                      } shipping option${
                        shipping_options.length > 1 ? "s" : ""
                      }`}
                    />
                  )}
                </div>
              )}
              {!(
                product_types.length > 0 &&
                products.length > 0 &&
                shipping_options.length > 0
              ) && (
                <Button
                  type="button"
                  onClick={() => {
                    layeredModalContext.push(
                      SelectOverridesScreen(
                        layeredModalContext.pop,
                        regionId,
                        handleOverridesSelected
                      )
                    )
                  }}
                  className="w-full mt-base"
                  size="medium"
                  variant="secondary"
                >
                  <PlusIcon /> Add Overrides
                </Button>
              )}
            </div>
          </Modal.Content>
          <Modal.Footer>
            <div className="flex items-center justify-end w-full">
              <Button
                type="button"
                onClick={onDismiss}
                variant="ghost"
                size="small"
                className="w-eventButton justify-center"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="small"
                className="w-eventButton justify-center"
              >
                Create
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Body>
      </form>
    </LayeredModal>
  )
}

const SelectOverridesScreen = (
  pop,
  regionId,
  onOverridesSelected,
  options = {}
) => {
  return {
    title: "Add override",
    onBack: () => pop(),
    view: (
      <TaxRuleSelector
        regionId={regionId}
        onSubmit={onOverridesSelected}
        {...options}
      />
    ),
  }
}

export default NewTaxRate
