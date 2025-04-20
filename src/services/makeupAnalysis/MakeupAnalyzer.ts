
export class MakeupAnalyzer {
  private known_makeup_looks = [
    "Natural/Minimal",
    "Glam/Bold",
    "Ethnic/Traditional",
    "Trendy/Editorial"
  ];

  private known_color_tips = [
    "Nude tones",
    "light blush",
    "Smokey eyes",
    "red lips",
    "shimmer",
    "Kohl eyes",
    "bold lips",
    "bindi",
    "Graphic liner",
    "colored eyeshadow"
  ];

  public getMakeupRecommendations(
    occasion?: string,
    region?: string,
    style?: string,
    colorPalette?: string
  ): MakeupRecommendation {
    if (!occasion || !region || !style || !colorPalette) {
      return { makeup_look: "unknown", color_tips: "unknown" };
    }

    const makeup_look = this.getMakeupLookRecommendation(occasion, region, style);
    const color_tips = this.getColorTipsRecommendation(colorPalette);

    return { makeup_look, color_tips };
  }

  private getMakeupLookRecommendation(
    occasion: string,
    region: string,
    style: string
  ): string {
    if (occasion === "daily" || occasion === "office") {
      return "Natural/Minimal";
    } else if (occasion === "parties" || occasion === "weddings") {
      return "Glam/Bold";
    } else if (
      (occasion === "festivals" || occasion === "rituals") &&
      (region === "Indian" || region === "Asian")
    ) {
      return "Ethnic/Traditional";
    } else if (occasion === "fashion events") {
      return "Trendy/Editorial";
    }
    return "unknown";
  }

  private getColorTipsRecommendation(colorPalette: string): string {
    switch (colorPalette) {
      case "neutral":
        return "Nude tones, light blush";
      case "warm tones":
        return "warm tones";
      case "cool tones":
        return "cool tones";
      default:
        return "unknown";
    }
  }
}
