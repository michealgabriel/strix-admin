// The wallet ledger's reasons, in the words staff use
const LABELS = {
  daily_reward: "Daily Strix",
  mission_reward: "Missions",
  mission_reward_unclaimed: "Missions (paid automatically)",
  strix_pass_reward: "Strix Pass",
  chest_reward: "Chest contents",
  chest_purchase: "Chests bought",
  ad_reward: "Rewarded ads",
  streak_milestone: "Streak milestones",
  streak_freeze: "Streak freezes",
  referral_bonus: "Invites (inviter)",
  referral_welcome: "Invites (new player)",
  welcome_back: "Welcome back gifts",
  tournament_commission: "Tournament host share",
  tournament_commission_clawback: "Host share taken back",
  tournament_entry_fee: "Tournament entry fees",
  tournament_entry_refund: "Tournament refunds",
  tournament_creation_fee: "Creating tournaments",
  pass_level_purchase: "Pass levels bought",
  gold_purchase: "Gold packs bought",
  gold_purchase_refund: "Gold pack refunds",
  admin_adjustment: "Staff adjustments",
  season_reset: "Season reset",
};

export function reasonLabel(reason) {
  if (LABELS[reason]) return LABELS[reason];
  const text = (reason ?? "").replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
