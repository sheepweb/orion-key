export type HelpArticle = {
  slug: string
  title: string
  description: string
  sections: Array<{ title: string; paragraphs: string[] }>
}

export const helpArticles: HelpArticle[] = [
  { slug: "payment", title: "支付说明", description: "介绍站点支持的支付方式、支付到账时机与常见支付异常处理。", sections: [
    { title: "支持方式", paragraphs: ["站点会根据后台已启用渠道展示可用支付方式。", "下单页展示什么渠道，用户就可直接按该渠道完成付款。"] },
    { title: "到账说明", paragraphs: ["支付成功后系统会自动轮询订单状态。", "若网络抖动导致页面未刷新，可在订单页或查询页再次确认结果。"] },
    { title: "异常处理", paragraphs: ["若出现支付成功但页面未跳转，请不要重复支付。", "建议优先通过订单查询确认，仍异常再联系站点客服处理。"] },
  ] },
  { slug: "delivery", title: "发货说明", description: "介绍数字商品的发货方式、发货时效和未收到货时的处理建议。", sections: [
    { title: "发货方式", paragraphs: ["本店以自动发货为主，部分商品可能需要人工复核后发放。", "下单前请确认商品说明中的交付形式与使用要求。"] },
    { title: "发货时效", paragraphs: ["自动发货商品通常在支付完成后尽快处理。", "若遇到库存校验、风控审核或渠道波动，发货时间可能略有延迟。"] },
    { title: "未收到处理", paragraphs: ["若订单状态已支付但未收到内容，请先刷新订单详情。", "如仍未收到，可凭订单号联系客服协助核查。"] },
  ] },
  { slug: "refund", title: "售后与退款说明", description: "说明数字商品售后边界、退款判定原则与联系客服时需提供的信息。", sections: [
    { title: "售后范围", paragraphs: ["数字商品一经交付，通常不支持无理由退换。", "若存在商品描述不符、无法使用等情况，可提交售后申请。"] },
    { title: "退款原则", paragraphs: ["是否退款将结合订单状态、商品交付情况和问题证据综合判断。", "已核销、已使用或可正常使用的数字商品，一般不支持退款。"] },
    { title: "处理建议", paragraphs: ["提交售后时请附上订单号、问题描述与必要截图。", "清晰的信息有助于更快完成核验与处理。"] },
  ] },
  { slug: "faq", title: "常见问题 FAQ", description: "汇总购买、支付、发货、售后中最常见的问题与简要解答。", sections: [
    { title: "下单后多久发货？", paragraphs: ["自动发货商品通常会在支付完成后尽快处理，特殊情况可能延迟。"] },
    { title: "支付成功但页面没刷新怎么办？", paragraphs: ["先不要重复付款，优先到订单查询页确认支付结果。"] },
    { title: "为什么订单失败或被关闭？", paragraphs: ["可能与库存、支付超时、风控校验或渠道异常有关，请重新下单或联系客服。"] },
    { title: "商品可以提现吗或转售吗？", paragraphs: ["请以具体商品说明与平台规则为准，部分数字商品存在使用限制。"] },
  ] },
  { slug: "buying-guide", title: "新手购买指南", description: "帮助首次下单的用户快速理解选品、下单、支付与收货流程。", sections: [
    { title: "购买流程", paragraphs: ["先浏览分类或商品详情，确认规格、价格与交付说明。", "下单后选择可用支付渠道，支付完成后等待系统处理。"] },
    { title: "下单前建议", paragraphs: ["请确认账号、区服、面值或其他必要信息填写无误。", "数字商品通常具有时效性，下单前建议仔细阅读商品详情。"] },
    { title: "收货后建议", paragraphs: ["收到商品后请尽快核验内容是否正确。", "若发现异常，尽量在第一时间保留证据并联系售后。"] },
  ] },
  { slug: "order-query-guide", title: "订单查询说明", description: "帮助用户快速了解订单查询入口、常见状态与异常处理方式。", sections: [
    { title: "查询入口", paragraphs: ["可通过订单查询页输入必要信息查看订单状态。", "若已登录，也可优先从个人订单页查看进度。"] },
    { title: "常见状态", paragraphs: ["待支付、已支付、处理中、已完成等状态会随着履约流程变化。", "遇到状态长时间不更新时，建议保留订单号后联系支持。"] },
  ] },
  { slug: "account-guide", title: "账号与资料填写说明", description: "说明下单时账号、区服、角色等资料填写的常见注意事项。", sections: [
    { title: "填写原则", paragraphs: ["请确保下单信息与商品要求完全一致。", "错误的账号或区服信息可能导致发货失败或延迟。"] },
    { title: "修改建议", paragraphs: ["若下单后发现信息填写错误，请尽快联系客服协助处理。", "部分已进入自动履约的订单可能无法再修改。"] },
  ] },
  { slug: "risk-review", title: "风控与审核说明", description: "解释订单可能触发风控或人工审核的常见原因与处理方式。", sections: [
    { title: "触发原因", paragraphs: ["高频下单、异常支付行为或资料不完整，都可能触发风控。", "这是为了保障交易安全与交付稳定性。"] },
    { title: "处理方式", paragraphs: ["如订单进入审核，请耐心等待系统或人工复核。", "必要时站点可能联系用户补充订单信息。"] },
  ] },
  { slug: "usage-notes", title: "商品使用注意事项", description: "汇总数字商品在激活、使用、时效和限制方面的注意事项。", sections: [
    { title: "使用前确认", paragraphs: ["请先阅读商品详情中的适用范围、版本限制和有效期说明。", "特殊商品可能仅适用于指定平台或账号类型。"] },
    { title: "使用后保留", paragraphs: ["建议在成功使用后保留必要凭证或截图。", "如遇异常，可更快协助售后核验。"] },
  ] },
  { slug: "contact-support", title: "联系我们与支持方式", description: "说明站点客服支持渠道、咨询时建议准备的信息与响应预期。", sections: [
    { title: "联系前准备", paragraphs: ["建议准备订单号、问题描述和相关截图。", "信息越完整，越有助于快速定位问题。"] },
    { title: "支持建议", paragraphs: ["非紧急问题可先查看 FAQ、支付说明和售后说明。", "若仍无法解决，再通过站点支持渠道联系人工处理。"] },
  ] },
  { slug: "payment-status-not-updated", title: "支付成功但页面未刷新说明", description: "说明支付完成后页面未立即更新时的常见原因，以及如何避免重复付款。", sections: [
    { title: "先查订单状态", paragraphs: ["支付成功后页面没刷新，不一定代表付款失败。", "建议优先回订单页或订单查询页确认是否已经显示已支付或处理中。"] },
    { title: "不要重复付款", paragraphs: ["只要支付记录已经存在，就不要因为页面未跳转而再次付款。", "重复支付往往会增加后续核对和退款沟通成本。"] },
    { title: "何时联系支持", paragraphs: ["若较长时间仍未更新，再整理订单号、支付时间和截图联系客服。", "先核对订单、再联系支持，通常比重复下单更稳妥。"] },
  ] },
  { slug: "support-info-preparation", title: "联系客服前的信息准备说明", description: "整理联系客服前最值得先准备的订单信息、截图与问题描述，提高处理效率。", sections: [
    { title: "基础信息", paragraphs: ["建议先准备订单号、下单时间、商品名称和支付渠道。", "没有订单号时，很多问题都难以快速定位。"] },
    { title: "问题描述", paragraphs: ["尽量明确说明是未到账、信息填写错误、商品无法使用还是页面未刷新。", "越具体的描述，越有助于减少来回补充信息。"] },
    { title: "截图与补充材料", paragraphs: ["可同步准备错误提示截图、订单状态截图和支付记录截图。", "如果你已经做过自查，也建议一并说明，便于支持人员快速判断。"] },
  ] },
]

export function getHelpArticle(slug: string) {
  return helpArticles.find((item) => item.slug === slug) || null
}

const HELP_GROUPS: Array<{ key: string; slugs: string[] }> = [
  { key: "pre-sale", slugs: ["buying-guide", "account-guide", "usage-notes"] },
  { key: "delivery", slugs: ["payment", "delivery", "order-query-guide", "payment-status-not-updated"] },
  { key: "after-sale", slugs: ["refund", "risk-review", "contact-support", "support-info-preparation"] },
  { key: "faq", slugs: ["faq"] },
]

export function getHelpGroupKey(slug: string) {
  return HELP_GROUPS.find((group) => group.slugs.includes(slug))?.key || "general"
}

export function getRelatedHelpArticles(slug: string, limit = 3) {
  const groupKey = getHelpGroupKey(slug)
  const sameGroup = helpArticles.filter((item) => item.slug !== slug && getHelpGroupKey(item.slug) === groupKey)
  if (sameGroup.length >= limit) return sameGroup.slice(0, limit)

  const fallback = helpArticles.filter((item) => item.slug !== slug && !sameGroup.some((same) => same.slug === item.slug))
  return [...sameGroup, ...fallback].slice(0, limit)
}

export function getHelpGroupArticles(slug: string) {
  const groupKey = getHelpGroupKey(slug)
  return helpArticles.filter((item) => getHelpGroupKey(item.slug) === groupKey)
}

export function getHelpPrevNextArticle(slug: string) {
  const groupArticles = getHelpGroupArticles(slug)
  const currentIndex = groupArticles.findIndex((item) => item.slug === slug)
  if (currentIndex === -1) return { prev: null, next: null }

  return {
    prev: groupArticles[currentIndex - 1] || null,
    next: groupArticles[currentIndex + 1] || null,
  }
}

