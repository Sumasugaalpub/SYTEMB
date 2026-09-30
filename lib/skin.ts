/**
 * Dashboard surface classes — the values the inv-* skin defined, expressed as
 * Tailwind utilities. Shared here because the same card/header/empty-state
 * shells repeat across the dashboard page and its child components.
 */

export const CARD =
  "rounded-[14px] border border-[#e8e8ea] bg-[#f0f0f1] p-px shadow-none dark:border-[var(--inv-card-border)] dark:bg-[#111214] dark:shadow-none";

/** Card that stretches inside .grid2 — header fixed, panel fills. */
export const CARD_STRETCH = `${CARD} flex flex-col`;

export const THEAD =
  "flex flex-none items-center justify-between bg-[image:var(--inv-hatch)] px-2 pt-[7px] pb-[9px]";

export const THEAD_TITLE =
  "flex items-center gap-[7px] text-[13.5px] font-bold text-[var(--inv-title)] [&_iconify-icon]:text-[15px] [&_iconify-icon]:text-[var(--inv-icon)] [&_svg]:size-[14px] [&_svg]:text-[var(--inv-icon)]";

export const SEE_ALL =
  "inline-flex items-center gap-[5px] text-[12.5px] font-semibold text-[var(--inv-brand-ink)] no-underline hover:underline [&_svg]:size-[13px]";

export const PANEL =
  "rounded-[11px] border border-[var(--inv-card-border)] bg-white px-4 py-[13px] dark:bg-[#131418]";

export const PANEL_FLUSH =
  "flex-1 overflow-hidden rounded-[11px] border border-[var(--inv-card-border)] bg-white p-0 dark:bg-[#131418]";

export const EMPTY_BOX =
  "flex min-h-[182px] flex-col items-center justify-center gap-[11px] rounded-[11px] border border-[var(--inv-card-border)] bg-white px-5 py-[48px] text-center dark:bg-[#131418]";

/** Empty state used inside a panel — borderless, shorter. */
export const EMPTY_INLINE =
  "flex flex-col items-center justify-center gap-[11px] border-none text-center";

export const EMPTY_ICON =
  "grid size-[50px] place-items-center rounded-[14px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] [&_iconify-icon]:text-[25px] [&_svg]:size-[25px]";

export const EMPTY_ICON_OK =
  "grid size-[50px] place-items-center rounded-[14px] bg-[#e7f6ee] text-[var(--inv-green)] dark:bg-[rgba(21,154,82,.14)] dark:text-[#57b07f] [&_iconify-icon]:text-[25px] [&_svg]:size-[25px]";

export const EMPTY_TITLE = "text-[14px] font-bold text-[var(--inv-value)]";
export const EMPTY_SUB = "-mt-1 text-[12px] text-[var(--inv-muted)]";

/* ---------------------------------- table --------------------------------- */

export const TABLE = "w-full border-collapse";

export const TH =
  "border-b border-b-[var(--inv-line)] px-1.5 py-[9px] text-left text-[11px] font-semibold tracking-[.04em] whitespace-nowrap text-[var(--inv-muted)] uppercase";

export const TD =
  "border-b border-b-[var(--inv-line)] px-1.5 py-[11px] text-[12.5px] whitespace-nowrap text-[#3b424d] dark:text-[var(--inv-value)]";

export const TR =
  "last:[&>td]:border-b-0 hover:bg-[#fafbfc] dark:hover:bg-[rgba(255,255,255,.02)]";

export const TD_MONO = "font-mono text-[11px] text-[var(--inv-muted)]";
export const TD_STRONG = "font-bold text-[var(--inv-value)]";
export const TD_POS = "font-bold text-[var(--inv-green)]";
export const TD_NEG = "font-bold text-[var(--inv-red)]";

/* ------------------------- document-page surfaces ------------------------- */
/* The selling / returns / POS screens share one chrome: pill actions, a counts
   hero, a wide search bar and a flush "big card". Values come straight from the
   design reference, so the shadowless dark variants are baked in here. */

/** Extra breathing room under the top bar these screens use (22px + 22px). */
export const DOC_PAGE = "pt-[22px]";

/** Right-aligned action row above the hero — .phead */
export const PHEAD = "mb-[18px] flex items-center justify-end gap-4";

/** .pill — outline action button */
export const PILL =
  "flex h-auto cursor-pointer items-center gap-[7px] rounded-[10px] border border-[var(--inv-card-border)] bg-white px-[13px] py-2 text-[12px] font-semibold whitespace-nowrap text-[#4a525e] shadow-none transition-colors duration-[120ms] hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#131418] dark:text-[var(--inv-value)] dark:hover:bg-[#17181c] [&_iconify-icon]:text-[15px] [&_iconify-icon]:text-[var(--inv-icon)]";

/** .pill.primary — brand action button */
export const PILL_PRIMARY =
  "flex h-auto cursor-pointer items-center gap-[7px] rounded-[10px] border border-[var(--inv-brand)] bg-[var(--inv-brand)] px-[13px] py-2 text-[12px] font-semibold whitespace-nowrap text-[var(--inv-brand-on)] shadow-none transition-colors duration-[120ms] hover:bg-[var(--inv-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50 [&_iconify-icon]:text-[15px] [&_iconify-icon]:text-[var(--inv-brand-on)]";

/** .hero — counts band */
export const HERO =
  "flex flex-col gap-5 rounded-[14px] border border-[var(--inv-card-border)] bg-white px-[22px] py-[18px] shadow-none min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between dark:bg-[#131418]";

export const HCOUNT_LABEL =
  "text-[10.5px] font-bold tracking-[.08em] whitespace-nowrap text-[var(--inv-muted2)] uppercase";

export const HCOUNT_VALUE =
  "mt-[7px] text-[26px] leading-none font-bold tracking-[-.02em] text-[var(--inv-value)] tabular-nums";

/** .step / .step.on — pipeline stepper pill */
export const STEP =
  "rounded-[20px] border border-transparent bg-[#eef0f4] px-[14px] py-2 text-[10.5px] font-bold tracking-[.05em] whitespace-nowrap text-[var(--inv-muted)] dark:bg-[#1c1d22]";

export const STEP_ON =
  "border-[var(--inv-brand-bd)] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] dark:bg-[var(--inv-brand-soft)]";

/** .bigsearch — full-width search bar */
export const BIGSEARCH =
  "mt-[18px] flex items-center gap-[11px] rounded-[12px] border border-[var(--inv-card-border)] bg-white px-4 py-[13px] text-[13px] text-[var(--inv-muted)] shadow-none dark:bg-[#131418] [&_iconify-icon]:text-[17px]";

/** .bigcard — flush card holding the table / empty state */
export const BIGCARD =
  "mt-[18px] overflow-hidden rounded-[14px] border border-[var(--inv-card-border)] bg-white shadow-none dark:bg-[#131418]";

/* -------------------------- large empty state ----------------------------- */

/** .otempty */
export const OTEMPTY = "flex flex-col items-center px-5 py-[66px] text-center";

/** .eicon2 */
export const EICON2 =
  "mb-4 grid size-16 place-items-center rounded-[18px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] [&_iconify-icon]:text-[30px]";

export const ETITLE2 = "text-[16px] font-bold text-[var(--inv-value)]";
export const ESUB2 =
  "mt-1.5 max-w-[340px] text-[13px] leading-[1.5] text-[var(--inv-muted)]";

/* ------------------------------ .otbl table ------------------------------- */

export const OTBL = "w-full border-collapse";

export const OTBL_TH =
  "border-t border-b border-t-[var(--inv-line)] border-b-[var(--inv-line)] bg-[#f7f8fa] px-2.5 py-[13px] text-left text-[11px] font-bold tracking-[.04em] whitespace-nowrap text-[var(--inv-muted)] uppercase first:pl-[18px] last:pr-[18px] dark:bg-[#16171b]";

export const OTBL_TD =
  "border-b border-b-[var(--inv-line)] px-2.5 py-4 align-middle text-[13px] text-[#3b424d] first:pl-[18px] last:pr-[18px] dark:text-[var(--inv-value)]";

export const OTBL_TR =
  "last:[&>td]:border-b-0 hover:bg-[#fafbfc] dark:hover:bg-[#161719]";

/* --------------------------------- modal ---------------------------------- */

/** .modal — dialog shell (pair with DialogContent) */
export const MODAL =
  "gap-0 overflow-hidden rounded-[18px] border border-[var(--inv-card-border)] bg-white p-0 ring-0 shadow-[0_24px_60px_rgba(16,24,40,.22)] dark:bg-[#131418]";

/** .mhead */
export const MHEAD =
  "flex items-start justify-between gap-3 border-b border-b-[var(--inv-line)] px-6 pt-[22px] pb-[18px]";

/** .micon */
export const MICON =
  "grid size-[42px] shrink-0 place-items-center rounded-[12px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] [&_iconify-icon]:text-[22px]";

export const MTITLE =
  "text-[20px] font-bold tracking-[-.01em] text-[var(--inv-value)]";

/** .mbody */
export const MBODY =
  "flex max-h-[62vh] flex-col gap-[18px] overflow-y-auto px-6 py-[22px]";

/** .mfoot */
export const MFOOT =
  "m-0 flex items-center justify-end gap-2.5 rounded-none border-t border-t-[var(--inv-line)] bg-transparent px-6 py-4";

/** .mx — square close button in a modal header */
export const MX =
  "grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[var(--inv-card-border)] bg-white p-0 text-[var(--inv-icon)] shadow-none hover:bg-[#f5f6f8] dark:bg-[#131418] dark:hover:bg-[#17181c] [&_iconify-icon]:text-[18px] [&_svg]:size-[18px]";

/** Popover/select panel in the document skin. */
export const DROPDOWN =
  "overflow-hidden rounded-[12px] border border-[var(--inv-card-border)] bg-white p-1.5 shadow-[0_14px_34px_rgba(16,24,40,.14)] dark:bg-[#131418]";

export const DROPDOWN_ITEM =
  "rounded-[8px] px-3 py-2.5 text-[13px] font-semibold text-[var(--inv-value)] focus:bg-[var(--inv-brand-soft)] focus:text-[var(--inv-brand-ink)] data-[state=checked]:bg-[var(--inv-brand-soft)] data-[state=checked]:text-[var(--inv-brand-ink)]";

/* ------------------------ catalogue / report surfaces --------------------- */

/** .headrow — actions-only header row (these screens carry no title block) */
export const HEADROW =
  "mb-[18px] flex items-start justify-between gap-4";

/** .hactions */
export const HACTIONS = "flex flex-shrink-0 items-center gap-[9px]";

/** .segt — segmented tab track (Products / Services) */
export const SEGT =
  "mb-[18px] inline-flex gap-1 rounded-[10px] bg-[#f1f1f2] p-[3px] dark:bg-[#131416]";

export const SEGT_BTN =
  "cursor-pointer rounded-lg border-none bg-transparent px-[18px] py-2 text-[13px] font-semibold text-[var(--inv-muted)] transition-colors duration-[140ms]";

export const SEGT_ON =
  "bg-white text-[var(--inv-value)] shadow-[0_1px_2px_rgba(16,24,40,.08)] dark:bg-[#212327] dark:shadow-none";

/** .segt as a Radix TabsList — neutralises the shadcn track. */
export const SEGT_LIST =
  "mb-[18px] inline-flex h-auto w-fit gap-1 rounded-[10px] border-none bg-[#f1f1f2] p-[3px] dark:bg-[#131416]";

/** .segt button as a Radix TabsTrigger — kills the underline + default active skin. */
export const SEGT_TRIGGER =
  "h-auto flex-none gap-1.5 rounded-lg border-none bg-transparent px-[18px] py-2 text-[13px] font-semibold text-[var(--inv-muted)] shadow-none after:hidden data-active:bg-white data-active:text-[var(--inv-value)] data-active:shadow-[0_1px_2px_rgba(16,24,40,.08)] dark:text-[var(--inv-muted)] dark:data-active:border-transparent dark:data-active:bg-[#212327] dark:data-active:text-[var(--inv-value)] dark:data-active:shadow-none [&_iconify-icon]:text-[19px] [&_iconify-icon]:text-[var(--inv-icon)] data-active:[&_iconify-icon]:text-[var(--inv-brand-ink)]";

/** .flayout — filter rail + results panel */
export const FLAYOUT =
  "grid grid-cols-[264px_1fr] items-start gap-[18px] max-[1000px]:grid-cols-1";

/** .frail */
export const FRAIL =
  "rounded-[14px] border border-[var(--inv-card-border)] bg-white p-[14px] shadow-none dark:bg-[#131418]";

/** .fsrch — compact search inside a rail or panel header */
export const FSRCH =
  "flex items-center gap-[9px] rounded-[10px] border border-[var(--inv-card-border)] px-3 py-2.5 text-[13px] text-[var(--inv-muted)] dark:bg-[#131418] [&_iconify-icon]:text-[16px]";

/** .fgl — rail group label */
export const FGL =
  "mx-1 mt-[14px] mb-2 text-[10.5px] font-bold tracking-[.08em] text-[var(--inv-muted2)] uppercase";

/** .frow — rail filter row */
export const FROW =
  "mb-0.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-[9px] px-3 py-[9px] text-left text-[13px] font-medium text-[#3b424d] transition-[background-color,color] duration-150 hover:bg-[#f2f3f5] dark:text-[#9398a1] dark:hover:bg-[#1e2027] dark:hover:text-[var(--inv-value)]";

export const FROW_ON =
  "bg-[var(--inv-brand-soft)] font-semibold text-[var(--inv-brand-ink)] hover:bg-[var(--inv-brand-soft)]";

/** .frow .b — trailing count badge */
export const FROW_BADGE =
  "rounded-[20px] bg-[#eef0f4] px-[9px] py-0.5 text-[11px] font-bold text-[var(--inv-muted2)] dark:bg-[#1c1d22]";

export const FROW_BADGE_ON =
  "bg-[rgba(146,194,240,.15)] text-[var(--inv-brand-ink)] dark:bg-[rgba(146,194,240,.15)]";

/** .panelcard */
export const PANELCARD =
  "rounded-[14px] border border-[var(--inv-card-border)] bg-white shadow-none dark:bg-[#131418]";

/** .pchead */
export const PCHEAD =
  "flex items-center justify-between gap-2.5 border-b border-b-[var(--inv-line)] px-[18px] py-[14px]";

export const PCHEAD_LABEL = "text-[13px] font-bold text-[var(--inv-value)]";

/* ------------------------------ empty states ------------------------------ */

/** .emptyc — centred empty block inside a panel */
export const EMPTYC = "px-5 py-20 text-center text-[var(--inv-muted)]";

export const EMPTYC_IC =
  "mx-auto mb-[14px] grid size-[56px] place-items-center rounded-[15px] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] [&_iconify-icon]:text-[27px]";

export const EMPTYC_IC_OK =
  "mx-auto mb-[14px] grid size-[56px] place-items-center rounded-[15px] bg-[#e7f6ee] text-[var(--inv-green)] dark:bg-[rgba(21,154,82,.15)] dark:text-[#57b07f] [&_iconify-icon]:text-[27px]";

export const EMPTYC_T = "text-[15px] font-bold text-[var(--inv-value)]";
export const EMPTYC_S = "mt-1.5 text-[13px]";

/** .emptyc .clr — "Clear filters" button */
export const EMPTYC_CLR =
  "mt-[14px] inline-flex h-auto cursor-pointer items-center rounded-[10px] border border-[var(--inv-card-border)] bg-white px-4 py-[9px] text-[13px] font-semibold text-[#3a414d] shadow-none hover:bg-[#f7f8fa] dark:bg-[#131418] dark:text-[var(--inv-value)] dark:hover:bg-[#17181c]";

/* ------------------------- valuation / distribution ----------------------- */

/** .vdist */
export const VDIST =
  "flex flex-wrap items-center justify-between gap-6 px-[22px] pt-5 pb-2";

export const VDIST_LABEL =
  "text-[10.5px] font-bold tracking-[.08em] text-[var(--inv-muted2)] uppercase";

export const VDIST_BIG =
  "mt-1.5 text-[30px] font-extrabold tracking-[-.02em] text-[var(--inv-value)] tabular-nums";

export const VMETRIC_K =
  "text-[10.5px] font-bold tracking-[.06em] text-[var(--inv-muted2)] uppercase";

export const VMETRIC_V =
  "mt-[5px] text-[22px] font-bold text-[var(--inv-value)] tabular-nums";

/** .vbar — the distribution track */
export const VBAR =
  "mx-[22px] mb-5 h-2 overflow-hidden rounded-[5px] bg-[var(--inv-line)] dark:bg-[rgba(255,255,255,.07)]";

/* ------------------------- movement tabs / form cards --------------------- */

/** .mtab */
export const MTAB =
  "flex h-auto cursor-pointer items-center gap-2 rounded-[10px] border border-[var(--inv-card-border)] bg-white px-[15px] py-[9px] text-[13px] font-semibold text-[#4a525e] shadow-none hover:bg-[#f7f8fa] dark:bg-[#131418] dark:text-[var(--inv-value)] dark:hover:bg-[#17181c] [&_iconify-icon]:text-[16px]";

export const MTAB_ON =
  "border-[var(--inv-brand-bd)] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] hover:bg-[var(--inv-brand-soft)] dark:bg-[var(--inv-brand-soft)] dark:text-[var(--inv-brand-ink)]";

/** .formcard */
export const FORMCARD =
  "mb-[18px] rounded-[14px] border border-[var(--inv-card-border)] bg-white px-[22px] py-5 shadow-none dark:bg-[#131418]";

export const SECTION_LBL =
  "mb-3 text-[13px] font-bold text-[var(--inv-value)]";

/** .section-lbl at the 15px form-card heading size. */
export const SECTION_LBL_LG =
  "mb-4 text-[15px] font-bold text-[var(--inv-value)]";

export const FORMFOOT =
  "flex items-center justify-end gap-2.5 pt-1.5";

/**
 * Scoped form skin — restyles the shared FormField slots (label / helper /
 * control) to the reference's .field + .inp values without touching the
 * component itself, so other screens keep their own look.
 */
export const FORM_SKIN = [
  "[&_[data-slot=form-item]]:gap-0",
  "[&_[data-slot=form-label]]:mb-[7px] [&_[data-slot=form-label]]:block [&_[data-slot=form-label]]:text-[12px] [&_[data-slot=form-label]]:font-bold [&_[data-slot=form-label]]:text-[var(--inv-value)]",
  "[&_[data-slot=form-description]]:mt-[-2px] [&_[data-slot=form-description]]:mb-[7px] [&_[data-slot=form-description]]:text-[11.5px] [&_[data-slot=form-description]]:text-[var(--inv-muted)]",
  "[&_[data-slot=form-message]]:mt-1.5 [&_[data-slot=form-message]]:text-[12px]",
  "[&_input]:h-[44px] [&_input]:rounded-[10px] [&_input]:border-[var(--inv-card-border)] [&_input]:px-[13px] [&_input]:text-[13.5px] [&_input]:text-[var(--inv-value)] [&_input]:shadow-none",
  "[&_input]:focus-visible:border-[var(--inv-brand)] [&_input]:focus-visible:ring-3 [&_input]:focus-visible:ring-[rgba(146,194,240,.12)]",
  "[&_textarea]:min-h-[76px] [&_textarea]:rounded-[10px] [&_textarea]:border-[var(--inv-card-border)] [&_textarea]:px-[13px] [&_textarea]:py-[11px] [&_textarea]:text-[13.5px] [&_textarea]:text-[var(--inv-value)] [&_textarea]:shadow-none",
  "[&_textarea]:focus-visible:border-[var(--inv-brand)] [&_textarea]:focus-visible:ring-3 [&_textarea]:focus-visible:ring-[rgba(146,194,240,.12)]",
  "dark:[&_input]:bg-[#131418] dark:[&_textarea]:bg-[#131418]",
].join(" ");

/** Select trigger inside a FORM_SKIN card — .inp height with the solar chevron. */
export const FORM_SELECT =
  "h-auto w-full rounded-[10px] border-[var(--inv-card-border)] bg-white px-[13px] py-0 text-[13.5px] text-[var(--inv-value)] shadow-none data-[size=default]:h-[44px] data-[size=sm]:h-[44px] focus-visible:border-[var(--inv-brand)] focus-visible:ring-3 focus-visible:ring-[rgba(146,194,240,.12)] dark:bg-[#131418] [&>svg]:hidden [&_iconify-icon]:ml-auto [&_iconify-icon]:text-[16px] [&_iconify-icon]:text-[var(--inv-icon)]";

/** The "Items … Total: $0.00" strip above a flush line-items table. */
export const ITEMS_STRIP =
  "flex items-center justify-between gap-3 px-[18px] pt-4 pb-2.5 text-[13px] text-[var(--inv-muted)] [&_b]:text-[var(--inv-value)]";

/** .banner — inline notice strip */
export const BANNER =
  "flex items-center gap-2.5 rounded-[12px] border border-[var(--inv-card-border)] bg-white px-4 py-[13px] text-[13px] text-[var(--inv-muted)] shadow-none dark:bg-[#131418] [&_iconify-icon]:text-[18px] [&_iconify-icon]:text-[var(--inv-icon)] [&_b]:text-[var(--inv-value)] [&_strong]:text-[var(--inv-value)]";

/** .tf — round type-filter pill */
export const TF =
  "h-auto cursor-pointer rounded-[20px] border border-[var(--inv-card-border)] bg-white px-[14px] py-[7px] text-[12.5px] font-semibold text-[#4a525e] shadow-none hover:bg-[#f7f8fa] dark:bg-[#131418] dark:text-[var(--inv-value)] dark:hover:bg-[#17181c]";

export const TF_ON =
  "border-[var(--inv-brand-bd)] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] hover:bg-[var(--inv-brand-soft)] dark:bg-[var(--inv-brand-soft)] dark:text-[var(--inv-brand-ink)]";

/** .leg / .legdot — chart legend */
export const LEG = "flex flex-wrap items-center gap-3.5";

export const LEGDOT =
  "inline-flex items-center gap-1.5 text-[11.5px] text-[var(--inv-muted)]";

/** .legdot i — the colour chip inside a legend entry */
export const LEGDOT_I = "size-[9px] rounded-[3px]";

/** .hchart — plot area above the date axis */
export const HCHART =
  "mt-[18px] mb-2 border-b border-b-[var(--inv-line)]";

/** .hx — the date axis under a chart */
export const HX =
  "flex justify-between pt-2 text-[10px] font-bold tracking-[.06em] text-[var(--inv-muted2)]";

/** .hfoot — chart footer stats */
export const HFOOT =
  "flex flex-wrap items-center justify-between gap-3 pt-2 text-[13px] text-[var(--inv-muted)] [&_b]:text-[var(--inv-value)] [&_strong]:text-[var(--inv-value)]";

/* ---------------------------- accounting skin ----------------------------- */

/** .fsel — pill dropdown trigger in a card toolbar */
export const FSEL =
  "flex h-auto w-auto items-center gap-2 rounded-full border border-[var(--inv-card-border)] bg-white px-4 py-[9px] text-[12.5px] font-semibold text-[#4a525e] shadow-none focus-visible:ring-0 data-[size=default]:h-auto dark:bg-[#131418] dark:text-[var(--inv-value)] [&>svg]:hidden [&_iconify-icon]:ml-auto [&_iconify-icon]:text-[16px] [&_iconify-icon]:text-[var(--inv-icon)]";

/** .osearch — pill search field in a card toolbar */
export const OSEARCH =
  "flex min-w-[240px] items-center gap-[9px] rounded-full border border-[var(--inv-card-border)] px-4 py-[9px] text-[13px] text-[var(--inv-muted)] dark:bg-[#131418] [&_iconify-icon]:text-[16px]";

/** .tinypill — compact toolbar action */
export const TINYPILL =
  "flex h-auto cursor-pointer items-center gap-1.5 rounded-[9px] border border-[var(--inv-card-border)] bg-white px-3 py-[7px] text-[12px] font-semibold whitespace-nowrap text-[#4a525e] shadow-none hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#131418] dark:text-[var(--inv-value)] dark:hover:bg-[#17181c] [&_iconify-icon]:text-[14px] [&_iconify-icon]:text-[var(--inv-icon)]";

/** .subhead — panel header title + caption */
export const SUBHEAD = "text-[13px] font-bold text-[var(--inv-value)]";
export const SUBHEAD_S =
  "mt-[3px] text-[11.5px] font-medium text-[var(--inv-muted)]";

/** .subhead at the 15px panel-title size used across the HR screens. */
export const PANEL_TITLE = "text-[15px] font-bold text-[var(--inv-title)]";

/** .subhead at 15px keeping the default value colour (no --title override). */
export const PANEL_TITLE_STRONG = "text-[15px] font-bold text-[var(--inv-value)]";

/** .cbx — square checkbox mark */
export const CBX =
  "size-[17px] shrink-0 rounded-[5px] border-[1.6px] border-[var(--inv-card-border)] bg-transparent p-0 text-white shadow-none data-checked:border-[var(--inv-brand)] data-checked:bg-[var(--inv-brand)] data-checked:text-[var(--inv-brand-on)] focus-visible:border-[var(--inv-brand)] focus-visible:ring-3 focus-visible:ring-[rgba(146,194,240,.12)] dark:bg-transparent dark:data-checked:bg-[var(--inv-brand)] [&>span>svg]:size-3";

/** .pcbody */
export const PCBODY = "px-[18px] py-4";

/** .prow — label/value list row */
export const PROW =
  "flex items-center justify-between py-[11px] text-[13px] text-[var(--inv-title)] not-first:border-t not-first:border-t-[var(--inv-line)]";

export const PROW_V = "font-bold text-[var(--inv-value)] tabular-nums";
export const PROW_NEG = "font-bold text-[var(--inv-red)] tabular-nums";

/** .tybadge — account-type badge */
export const TYBADGE =
  "inline-flex rounded-[20px] px-2.5 py-[3px] text-[11px] font-bold";

export const TYBADGE_TONE: Record<string, string> = {
  Asset: "bg-[#e2f5f2] text-[var(--inv-teal)] dark:bg-[rgba(13,154,140,.16)] dark:text-[#4fb3a6]",
  Expense: "bg-[#fdecec] text-[var(--inv-red)] dark:bg-[rgba(217,74,74,.16)] dark:text-[#e57e7e]",
  Income: "bg-[#e7f6ee] text-[var(--inv-green)] dark:bg-[rgba(21,154,82,.16)] dark:text-[#57b07f]",
  Liability: "bg-[#fdf3e1] text-[var(--inv-amber)] dark:bg-[rgba(217,138,6,.16)] dark:text-[#d2a24a]",
  Equity: "bg-[#efecfd] text-[var(--inv-violet)] dark:bg-[rgba(122,108,240,.18)] dark:text-[#9a8ff0]",
};

/** .kindbadge — System / Custom */
export const KINDBADGE =
  "inline-flex rounded-[20px] bg-[#eef0f4] px-2.5 py-[3px] text-[11px] font-semibold text-[var(--inv-muted)] dark:bg-[#1c1d22]";

/** .otbl .tot td — totals row */
export const OTBL_TOT =
  "border-t border-t-[var(--inv-line)] bg-[#fafbfc] font-bold text-[var(--inv-value)] dark:bg-[#16171b]";

/** .editbtn — small square row action */
export const EDITBTN =
  "grid size-[30px] cursor-pointer place-items-center rounded-lg border border-[var(--inv-card-border)] bg-white p-0 text-[var(--inv-icon)] shadow-none hover:bg-[#f7f8fa] dark:bg-[#131418] dark:hover:bg-[#17181c] [&_iconify-icon]:text-[15px] [&_svg]:size-[15px]";

/** .dateinp — bordered date field */
export const DATEINP =
  "flex h-auto min-w-[150px] w-auto items-center gap-2 rounded-[10px] border border-[var(--inv-card-border)] bg-white px-3 py-[9px] text-[13px] text-[var(--inv-value)] shadow-none focus-visible:border-[var(--inv-brand)] focus-visible:ring-3 focus-visible:ring-[rgba(146,194,240,.12)] dark:bg-[#131418] [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-55 dark:[&::-webkit-calendar-picker-indicator]:invert";

/** .otbl-style statement row — account name + amount */
export const STMT_ROW =
  "flex items-center justify-between border-t border-t-[var(--inv-line)] px-[18px] py-[11px] text-[13px] text-[var(--inv-title)]";

export const STMT_ROW_V = "font-bold text-[var(--inv-value)] tabular-nums";

/** .coatab — icon type filter */
export const COATAB =
  "flex h-auto cursor-pointer items-center gap-1.5 rounded-full border border-[var(--inv-card-border)] bg-white px-[14px] py-[7px] text-[12.5px] font-semibold text-[#4a525e] shadow-none hover:bg-[#f7f8fa] dark:bg-[#131418] dark:text-[var(--inv-value)] dark:hover:bg-[#17181c] [&_iconify-icon]:text-[19px] [&_iconify-icon]:text-[var(--inv-icon)]";

export const COATAB_ON =
  "border-[var(--inv-brand-bd)] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] hover:bg-[var(--inv-brand-soft)] dark:bg-[var(--inv-brand-soft)] dark:text-[var(--inv-brand-ink)] [&_iconify-icon]:text-[var(--inv-brand-ink)]";

/* -------------------------- statement (P&L) rows -------------------------- */

/** .sectionrow — hatched section header with a total */
export const SECTIONROW =
  "flex items-center justify-between bg-[image:var(--inv-hatch)] px-[18px] py-[14px]";

export const SECTIONROW_L =
  "flex items-center gap-2 text-[13.5px] font-bold text-[var(--inv-value)] [&_iconify-icon]:text-[16px] [&_iconify-icon]:text-[var(--inv-icon)]";

export const SECTIONROW_V = "text-[14px] font-bold text-[var(--inv-value)] tabular-nums";

/** .subrow — muted note under a section */
export const SUBROW =
  "border-t border-t-[var(--inv-line)] px-[18px] py-[11px] text-[12px] text-[var(--inv-muted)]";

/** .totline — uppercase subtotal line */
export const TOTLINE =
  "flex items-center justify-between border-t border-t-[var(--inv-line)] px-[18px] py-3 text-[12.5px] font-bold tracking-[.04em] text-[var(--inv-muted)] uppercase";

export const TOTLINE_V = "text-[14px] text-[var(--inv-value)] tabular-nums";

/** .plfoot — brand-tinted profit/loss footer */
export const PLFOOT =
  "flex items-center justify-between bg-[var(--inv-brand-soft)] px-[18px] py-[14px] dark:bg-[rgba(146,194,240,.12)]";

export const PLFOOT_L =
  "flex items-center gap-2 text-[14px] font-bold text-[var(--inv-value)] [&_iconify-icon]:text-[16px]";

export const PLFOOT_V = "text-[15px] font-extrabold text-[var(--inv-brand-ink)] tabular-nums";

/** .field label */
export const FIELD_LABEL =
  "mb-[7px] block text-[12px] font-bold text-[var(--inv-value)]";

/** .inp — 44px form control */
export const INP =
  "h-[44px] w-full rounded-[10px] border border-[var(--inv-card-border)] bg-white px-[13px] text-[13.5px] text-[var(--inv-value)] shadow-none focus-visible:border-[var(--inv-brand)] focus-visible:ring-3 focus-visible:ring-[rgba(146,194,240,.12)] dark:bg-[#131418]";

/* -------------------------- administration skin --------------------------- */
/* Audit Log, Roles & Access and the nine Settings panels. Same rule as above:
   one declaration per reference class, both themes driven by the inv-* vars. */

/** .setwrap — settings sub-nav rail + selected panel */
export const SETWRAP = "grid items-start gap-[18px] lg:grid-cols-[224px_1fr]";

/** .setnav — the sub-nav card (pair with <Card>) */
export const SETNAV =
  "gap-0 rounded-[14px] border-[var(--inv-card-border)] bg-white p-2 py-2 shadow-none dark:bg-[#131418]";

/** .setnav a */
export const SETNAV_ITEM =
  "mb-0.5 flex w-full cursor-pointer items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-left text-[13px] font-semibold text-[#3b424d] no-underline transition-[background-color,color] duration-150 hover:bg-[#f2f3f5] dark:text-[var(--inv-title)] dark:hover:bg-[#1e2027] dark:hover:text-[var(--inv-value)] [&_iconify-icon]:shrink-0 [&_iconify-icon]:text-[18px] [&_iconify-icon]:text-[var(--inv-icon)] dark:hover:[&_iconify-icon]:text-[var(--inv-value)]";

/** .setnav a.on */
export const SETNAV_ON =
  "bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] hover:bg-[var(--inv-brand-soft)] dark:hover:bg-[var(--inv-brand-soft)] [&_iconify-icon]:text-[var(--inv-brand-ink)]";

/** .pcard — settings/admin panel card (pair with <Card>) */
export const PCARD =
  "mb-[18px] gap-0 overflow-hidden rounded-[14px] border-[var(--inv-card-border)] bg-white py-0 text-[13px] shadow-none dark:bg-[#131418]";

/** .pchd — panel header (pair with <CardHeader className={PCHD}>) */
export const PCHD =
  "flex items-start justify-between gap-4 border-b border-b-[var(--inv-line)] px-5 py-[18px] [.border-b]:pb-[18px]";

/** .pchd .s — panel sub-line (title uses PANEL_TITLE) */
export const PCHD_S =
  "mt-1 max-w-[520px] text-[12.5px] leading-[1.5] text-[var(--inv-muted)]";

/** .pcbody — 20px panel body */
export const PCBODY_LG = "p-5";

/** .emp — centred "nothing here yet" block */
export const EMP = "px-5 py-[60px] text-center text-[var(--inv-muted)]";
export const EMP_T = "text-[14px] font-semibold text-[var(--inv-value)]";
export const EMP_S = "mt-[5px] text-[12.5px]";

/** .fgrid — two-column settings form */
export const FGRID = "grid gap-x-[22px] gap-y-[18px] sm:grid-cols-2";

/** .fld2 */
export const FLD2 = "flex min-w-0 flex-col";
export const FLD2_LABEL = "mb-[7px] text-[12px] font-bold text-[var(--inv-value)]";
export const FLD2_REQ = "text-[var(--inv-red)]";
export const FLD2_NOTE = "mt-1.5 text-[11.5px] text-[var(--inv-muted)]";

/** .selwrap — relative wrapper holding a select + its chevron */
export const SELWRAP = "relative flex-1";

/** .sw — 40×23 pill toggle (pair with <Switch className={SWITCH}>) */
export const SWITCH =
  "h-[23px] w-[40px] shrink-0 rounded-full border-none px-[2px] data-[size=default]:h-[23px] data-[size=default]:w-[40px] data-checked:bg-[var(--inv-brand)] data-unchecked:bg-[#d7dbe2] dark:data-unchecked:bg-[#2a2d34] [&_[data-slot=switch-thumb]]:size-[19px]! [&_[data-slot=switch-thumb]]:bg-white! [&_[data-slot=switch-thumb]]:shadow-[0_1px_2px_rgba(0,0,0,.25)]";

/** .sw.lk — locked-on toggle */
export const SWITCH_LK = "cursor-not-allowed opacity-50";

/** .lk — the small lock mark beside a locked toggle */
export const LK = "ml-[7px] align-middle text-[13px] text-[var(--inv-muted2)]";

/** .ckon — green "always on" check */
export const CKON = "text-[19px] text-[var(--inv-brand-ink)]";

/** .rolebadge */
export const ROLEBADGE =
  "inline-flex rounded-[20px] px-[11px] py-1 text-[11px] font-bold tracking-[.02em] whitespace-nowrap";

/** .rb-admin / .rb-sup / .rb-cash */
export const ROLEBADGE_TONE: Record<string, string> = {
  Admin: "bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)]",
  Supervisor: "bg-[#eaf1fd] text-[var(--inv-blue)] dark:bg-[rgba(47,119,230,.16)]",
  Cashier: "bg-[#fdf3e1] text-[var(--inv-amber)] dark:bg-[rgba(217,138,6,.16)]",
};

/** .stbadge — green "Active" status pill */
export const STBADGE =
  "inline-flex items-center gap-[5px] rounded-[20px] bg-[#e7f6ee] px-[11px] py-1 text-[11px] font-bold whitespace-nowrap text-[var(--inv-green)] dark:bg-[rgba(21,154,82,.16)] [&_iconify-icon]:text-[13px]";

/** .stbadge in its neutral (disabled member) tone */
export const STBADGE_OFF =
  "bg-[#eef0f4] text-[var(--inv-muted)] dark:bg-[#1c1d22]";

/* ------------------------------ .mtbl table ------------------------------- */

export const MTBL = "w-full border-collapse";

export const MTBL_TH =
  "border-b border-b-[var(--inv-line)] px-[14px] py-3 text-left text-[10.5px] font-bold tracking-[.05em] whitespace-nowrap text-[var(--inv-muted)] uppercase";

export const MTBL_TD =
  "border-b border-b-[var(--inv-line)] p-[14px] align-middle text-[13px] text-[#3b424d] dark:text-[var(--inv-value)]";

export const MTBL_TR = "last:[&>td]:border-b-0";

/* ------------------------------ .ftbl table ------------------------------- */

export const FTBL = "w-full border-collapse";

export const FTBL_TH =
  "border-b border-b-[var(--inv-line)] bg-[#f7f8fa] px-[14px] py-3 text-left text-[10.5px] font-bold tracking-[.05em] whitespace-nowrap text-[var(--inv-muted)] uppercase dark:bg-[#16171b]";

export const FTBL_TD =
  "border-b border-b-[var(--inv-line)] px-[14px] py-[13px] align-middle text-[13px] text-[#3b424d] dark:text-[var(--inv-value)]";

export const FTBL_TR =
  "last:[&>td]:border-b-0 hover:bg-[#fafbfc] dark:hover:bg-[#161719]";

/* --------------------------------- team ----------------------------------- */

/** .member */
export const MEMBER = "flex items-center gap-3";
export const MEMBER_AV =
  "size-[38px] shrink-0 rounded-full bg-[var(--inv-brand)] text-[12px] font-bold text-[var(--inv-brand-on)]";
export const MEMBER_NM = "text-[13.5px] font-bold text-[var(--inv-value)]";
export const MEMBER_EM = "mt-px text-[11.5px] text-[var(--inv-muted)]";

/** .infobar — brand-tinted notice inside a panel */
export const INFOBAR =
  "flex items-center gap-[9px] rounded-[10px] bg-[var(--inv-brand-soft)] px-[14px] py-[11px] text-[12.5px] leading-[1.5] font-medium text-[var(--inv-brand-ink)] [&_iconify-icon]:shrink-0 [&_iconify-icon]:text-[16px]";

/** .infobar in its amber (policy warning) tone */
export const INFOBAR_AMBER =
  "bg-[#fdf6e7] text-[var(--inv-amber)] dark:bg-[rgba(217,138,6,.12)]";

/** .warnbar — muted footnote strip under a table */
export const WARNBAR =
  "flex items-center gap-[9px] px-5 py-[11px] text-[12.5px] text-[var(--inv-muted)] [&_iconify-icon]:shrink-0 [&_iconify-icon]:text-[16px] [&_iconify-icon]:text-[var(--inv-amber)]";

/** .rolegrid / .rolecard */
export const ROLEGRID = "grid gap-4 sm:grid-cols-3";
export const ROLECARD =
  "rounded-[14px] border border-[var(--inv-card-border)] px-[18px] py-4";
export const ROLECARD_LIST = "mt-[14px] flex list-none flex-col gap-[9px] p-0";
export const ROLECARD_LI =
  "flex items-start gap-[9px] text-[12.5px] leading-[1.4] text-[var(--inv-title)] [&_iconify-icon]:mt-px [&_iconify-icon]:shrink-0 [&_iconify-icon]:text-[15px] [&_iconify-icon]:text-[var(--inv-brand-ink)]";

/* ----------------------------- custom fields ------------------------------ */

/** .tybadge2 — custom-field type chip */
export const TYBADGE2 =
  "inline-flex rounded-[7px] px-2.5 py-[3px] text-[11px] font-bold whitespace-nowrap";

/** .ty-text / .ty-select / .ty-date */
export const TYBADGE2_TONE: Record<string, string> = {
  Text: "bg-[#eef0f4] text-[var(--inv-muted)] dark:bg-[#1c1d22]",
  Select: "bg-[#eaf1fd] text-[var(--inv-blue)] dark:bg-[rgba(47,119,230,.16)]",
  Date: "bg-[#efecfd] text-[var(--inv-violet)] dark:bg-[rgba(122,108,240,.16)]",
  Number: "bg-[#e7f6ee] text-[var(--inv-green)] dark:bg-[rgba(21,154,82,.16)]",
};

/** .reqbadge / .reqbadge.on */
export const REQBADGE = "text-[11px] font-bold text-[var(--inv-muted)]";
export const REQBADGE_ON = "text-[var(--inv-amber)]";

/** .rowact — right-aligned row action group (buttons use EDITBTN / .iact) */
export const ROWACT = "flex justify-end gap-1.5";

/* --------------------------- stock preferences ---------------------------- */

/** .choice / .choicecard */
export const CHOICE = "grid gap-[14px] sm:grid-cols-2";
export const CHOICECARD =
  "cursor-pointer rounded-[12px] border-[1.5px] border-[var(--inv-card-border)] bg-transparent px-[18px] py-4 text-left";
export const CHOICECARD_ON =
  "border-[var(--inv-brand)] bg-[var(--inv-brand-soft)]";
export const CHOICECARD_DIS = "cursor-default opacity-60";
export const CHOICECARD_CT =
  "flex items-center gap-2 text-[13.5px] font-bold text-[var(--inv-value)]";
export const CHOICECARD_SOON =
  "rounded-[12px] bg-[#eef0f4] px-2 py-0.5 text-[10px] font-bold text-[var(--inv-muted)] dark:bg-[#1c1d22]";
export const CHOICECARD_CS =
  "mt-1.5 text-[12px] leading-[1.5] text-[var(--inv-muted)]";

/** .prow — settings preference row (label block + trailing control) */
export const SETTING_ROW =
  "flex items-start justify-between gap-5 border-t border-t-[var(--inv-line)] py-4 first:border-t-0";
export const SETTING_ROW_L = "text-[13px] font-bold text-[var(--inv-value)]";
export const SETTING_ROW_S =
  "mt-1 max-w-[560px] text-[12px] leading-[1.5] text-[var(--inv-muted)]";

/** .seclbl / .secsub */
export const SECLBL = "mb-[3px] text-[13.5px] font-bold text-[var(--inv-value)]";
export const SECSUB = "mb-[14px] text-[12px] text-[var(--inv-muted)]";

/** .taxrow */
export const TAXROW = "grid items-end gap-[14px] sm:grid-cols-[1fr_140px_auto]";

/** .mini */
export const MINI = "mt-1.5 text-[11.5px] text-[var(--inv-muted)]";

/* -------------------------------- audit log ------------------------------- */

/** .chip / .chip.on — round filter chip */
export const CHIP =
  "flex h-auto cursor-pointer items-center gap-1.5 rounded-full border border-[var(--inv-card-border)] bg-white px-[14px] py-[7px] text-[12px] font-semibold whitespace-nowrap text-[var(--inv-muted)] shadow-none hover:bg-[#f7f8fa] dark:bg-[#131418] dark:hover:bg-[#17181c] [&_b]:font-bold [&_iconify-icon]:text-[14px]";

export const CHIP_ON =
  "border-[var(--inv-brand-bd)] bg-[var(--inv-brand-soft)] text-[var(--inv-brand-ink)] hover:bg-[var(--inv-brand-soft)] dark:bg-[var(--inv-brand-soft)] dark:hover:bg-[var(--inv-brand-soft)]";

/** .auditbar — one white bar holding the search field and the filter chips */
export const AUDITBAR =
  "flex flex-wrap items-center gap-3 rounded-[12px] border border-[var(--inv-card-border)] bg-white p-3 dark:bg-[#131418]";
