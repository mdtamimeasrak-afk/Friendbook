import { StyleSheet, View } from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Avatar } from "@/components/ui/avatar";
import { AppText } from "@/components/ui/app-text";

export interface ProfileHeaderProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  username?: string | null;
  bio?: string | null;
}

/**
 * Compact profile header used on the Profile tab and
 * other-user profile screens.
 */
export function ProfileHeader({ avatarUrl, fullName, username, bio }: ProfileHeaderProps) {
  const { colors, radius: radii } = useTheme();

  return (
    <View style={styles.wrap}>
      <Avatar uri={avatarUrl} name={fullName} size={84} />
      <View style={styles.info}>
        <AppText level="heading" align="center" numberOfLines={1}>
          {fullName || "SocialHub user"}
        </AppText>
        {username ? (
          <AppText level="caption" color="textMuted" align="center">
            @{username}
          </AppText>
        ) : null}
        {bio ? (
          <AppText level="body" color="textSecondary" align="center" style={styles.bio}>
            {bio}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  info: {
    marginTop: spacing.sm,
    alignSelf: "stretch",
  },
  bio: {
    marginTop: spacing.xs,
  },
});