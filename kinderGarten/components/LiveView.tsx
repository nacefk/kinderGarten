import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect } from "expo-router";
import { RotateCcw, Maximize2, Play } from "lucide-react-native";
import colors from "@/config/colors";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";

export default function LiveView() {
  const [isError, setIsError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);

  const videoUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"; // Replace later

  // 🎥 Initialize video player
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });

  // ▶️ Play on tap
  const handlePlay = () => {
    if (!isPlaying) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  };

  // 🧭 Stop video when screen loses focus
  useFocusEffect(
    useCallback(() => {
      // When entering screen
      return () => {
        //  player.pause();
        setIsPlaying(false);
      };
    }, [])
  );

  return (
    <View
      className="rounded-2xl mb-6 overflow-hidden"
      style={{ backgroundColor: colors.cardBackground }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.error }} />
          <Text className="text-lg font-semibold" style={{ color: colors.textDark }}>
            {t("live.title")}
          </Text>
        </View>
        <Text className="text-sm" style={{ color: colors.textLight }}>
          {t("live.watching").replace("{name}", "Emma Johnson")}
        </Text>
      </View>

      {/* Video Area */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePlay}
        className="w-full h-56 bg-black items-center justify-center"
      >
        {isError ? (
          <Text className="text-sm text-center" style={{ color: colors.textLight }}>
            {t("live.error_stream")}
          </Text>
        ) : isBuffering ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : (
          <>
            <VideoView
              player={player}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              allowsPictureInPicture
              fullscreenOptions={{
                enable: true,
                orientation: "landscape",
              }}
            />
            {!isPlaying && (
              <View className="absolute inset-0 items-center justify-center">
                <Play size={48} color={colors.accent} />
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
