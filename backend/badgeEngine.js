import { BADGES, getBadgesForScore, getBadgeById } from "./badges.js";
import { signBadge } from "./badgeSigner.js";
import { getPlayerStats, recordGameResult } from "./leaderboard.js";

export function issueBadge(req, res) {
  const { address, score, badgeId } = req.body;
  
  // If specific badge requested
  if (badgeId) {
    const badge = getBadgeById(badgeId);
    if (!badge) return res.status(400).json({ error: "Badge not found" });
    
    // Check if player qualifies
    const stats = getPlayerStats(address);
    if (badge.min > 0 && stats.bestScore < badge.min) {
      return res.status(400).json({ error: "Score requirement not met" });
    }
    
    return res.json({ 
      badge: badge.id,
      badgeData: badge,
      signature: signBadge(address, badge.id) 
    });
  }
  
  // Auto-issue badges based on score
  const badges = getBadgesForScore(score);
  if (badges.length === 0) {
    return res.status(400).json({ error: "No badges available for this score" });
  }
  
  // Get the highest badge
  const badge = badges[badges.length - 1];
  
  res.json({ 
    badge: badge.id,
    badgeData: badge,
    allBadges: badges.map(b => ({ id: b.id, ...b })),
    signature: signBadge(address, badge.id) 
  });
}

export function getPlayerBadges(req, res) {
  const { address } = req.params;
  const stats = getPlayerStats(address);
  
  // Get score-based badges
  const scoreBadges = getBadgesForScore(stats.bestScore);
  
  // Get achievement badges based on stats
  const achievementBadges = [];
  if (stats.wins >= 1) {
    achievementBadges.push(getBadgeById("first_win"));
  }
  if (stats.gamesPlayed >= 10) {
    achievementBadges.push(getBadgeById("veteran"));
  }
  
  const allBadges = [...scoreBadges, ...achievementBadges].filter(Boolean);
  
  res.json({
    address,
    badges: allBadges.map(b => ({ id: b.id, ...b })),
    stats
  });
}
