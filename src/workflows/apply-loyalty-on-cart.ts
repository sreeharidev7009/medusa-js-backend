import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { 
  createPromotionsStep, 
  updateCartPromotionsWorkflow, 
  updateCartsStep, 
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { 
  validateCustomerExistsStep, 
  ValidateCustomerExistsStepInput,
} from "./steps/validate-customer-exists"
import { 
  getCartLoyaltyPromoAmountStep, 
  GetCartLoyaltyPromoAmountStepInput,
} from "./steps/get-cart-loyalty-promo-amount"
import { CartData, CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE } from "../utils/promo"
import { CreatePromotionDTO } from "@medusajs/framework/types"
import { PromotionActions } from "@medusajs/framework/utils"
import { getCartLoyaltyPromoStep } from "./steps/get-cart-loyalty-promo"

type WorkflowInput = {
  cart_id: string
}

const fields = [
  "id",
  "customer.*",
  "promotions.*",
  "promotions.application_method.*",
  "promotions.rules.*",
  "promotions.rules.values.*",
  "currency_code",
  "total",
  "metadata",
]

export const applyLoyaltyOnCartWorkflow = createWorkflow(
  "apply-loyalty-on-cart",
  (input: WorkflowInput) => {
    // 1. Retrieve cart details
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields,
      filters: {
        id: input.cart_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    // 2. Validate customer exists
    validateCustomerExistsStep({
      customer: carts[0].customer,
    } as ValidateCustomerExistsStepInput)

    // 3. Ensure no loyalty promo is already applied
    getCartLoyaltyPromoStep({
      cart: carts[0] as unknown as CartData,
      throwErrorOn: "found",
    })

    // 4. Calculate loyalty promo amount
    const amount = getCartLoyaltyPromoAmountStep({
      cart: carts[0],
    } as unknown as GetCartLoyaltyPromoAmountStepInput)

    // 5. Prepare promotion data
    const promoToCreate = transform(
      { carts, amount },
      (data) => {
        const randomStr = Math.random().toString(36).substring(2, 8)
        const uniqueId = (
          "LOYALTY-" + data.carts[0].customer?.first_name + "-" + randomStr
        ).toUpperCase()
        return {
          code: uniqueId,
          type: "standard",
          status: "active",
          application_method: {
            type: "fixed",
            value: data.amount,
            target_type: "order",
            currency_code: data.carts[0].currency_code,
            allocation: "across",
          },
          rules: [
            {
              attribute: CUSTOMER_ID_PROMOTION_RULE_ATTRIBUTE,
              operator: "eq",
              values: [data.carts[0].customer!.id],
            },
          ],
          campaign: {
            name: uniqueId,
            description: "Loyalty points promotion for " + data.carts[0].customer!.email,
            campaign_identifier: uniqueId,
            budget: {
              type: "usage",
              limit: 1,
            },
          },
        }
      }
    )

    // 6. Create the promotion
    const loyaltyPromo = createPromotionsStep([
      promoToCreate,
    ] as CreatePromotionDTO[])

    // 7. Prepare update data for cart promotions and metadata
    const { metadata, ...updatePromoData } = transform(
      { carts, promoToCreate, loyaltyPromo },
      (data) => {
        const promos = [
          ...(data.carts[0].promotions?.map((promo) => promo?.code).filter(Boolean) || []) as string[],
          data.promoToCreate.code,
        ]
        return {
          cart_id: data.carts[0].id,
          promo_codes: promos,
          action: PromotionActions.ADD,
          metadata: {
            loyalty_promo_id: data.loyaltyPromo[0].id,
          },
        }
      }
    )

    // 8. Apply the promotion to the cart
    updateCartPromotionsWorkflow.runAsStep({
      input: updatePromoData,
    })

    // 9. Update the cart's metadata
    updateCartsStep([
      {
        id: input.cart_id,
        metadata,
      },
    ])

    // 10. Retrieve and return the updated cart
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      fields,
      filters: { id: input.cart_id },
    }).config({ name: "retrieve-cart" })

    return new WorkflowResponse(updatedCarts[0])
  }
)