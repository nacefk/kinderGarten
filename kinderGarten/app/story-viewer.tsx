import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const stories = [
  { id: "1", type: "image", uri: "https://i.pravatar.cc/600?img=20" },
  { id: "2", type: "video", uri: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { id: "3", type: "image", uri: "https://i.pravatar.cc/600?img=25" },
];

export default function StoryViewer() {
  const { index } = useLocalSearchParams();
  const startIndex = Number(index || 0);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const handleDownload = async () => {
    const currentStory = stories[currentIndex];
    try {
      // Ask for permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to save media.");
        return;
      }

      const fileExtension =
        currentStory.type === "video" ? ".mp4" : ".jpg";
      const fileUri = FileSystem.documentDirectory + `story${fileExtension}`;

      // Download file
      const { uri } = await FileSystem.downloadAsync(currentStory.uri, fileUri);

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("✅ Saved", "File has been saved to your gallery.");
    } catch (error) {
      console.error("Download failed:", error);
      Alert.alert("Error", "Failed to download file.");
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Close Button */}
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/activity")}
        className="absolute top-14 right-5 z-10"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 }}
      >
        <X color="#fff" size={30} />
      </TouchableOpacity>

      {/* Download Button */}
      <TouchableOpacity
        onPress={handleDownload}
        className="absolute top-14 left-5 z-10"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 }}
      >
        <Download color="#fff" size={28} />
      </TouchableOpacity>

      {/* Pagination Info */}
      <Text className="absolute top-16 left-16 text-white text-sm z-10">
        {currentIndex + 1}/{stories.length}
      </Text>

      {/* Swipeable Stories */}
      <FlatList
        ref={flatListRef}
        data={stories}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={() => {
          flatListRef.current?.scrollToOffset({
            offset: startIndex * width,
            animated: false,
          });
        }}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        renderItem={({ item, index }) => (
          <StoryItem item={item} index={index} currentIndex={currentIndex} />
        )}
      />

      {/* Left Chevron (same level) */}
      {currentIndex > 0 && (
        <TouchableOpacity
          onPress={handlePrev}
          className="absolute left-3 z-10 p-2"
          style={{
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: 999,
            top: "60%",
            transform: [{ translateY: -20 }],
          }}
        >
          <ChevronLeft color="#fff" size={36} />
        </TouchableOpacity>
      )}

      {/* Right Chevron (same level) */}
      {currentIndex < stories.length - 1 && (
        <TouchableOpacity
          onPress={handleNext}
          className="absolute right-3 z-10 p-2"
          style={{
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: 999,
            top: "60%",
            transform: [{ translateY: -20 }],
          }}
        >
          <ChevronRight color="#fff" size={36} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Each story item (image or video) */
function StoryItem({
  item,
  index,
  currentIndex,
}: {
  item: { type: string; uri: string };
  index: number;
  currentIndex: number;
}) {
  const isActive = index === currentIndex;
  const player =
    item.type === "video"
      ? useVideoPlayer(item.uri, (player) => {
          player.loop = true;
        })
      : null;

  useEffect(() => {
    if (player) {
      if (isActive) player.play();
      else player.pause();
    }
  }, [isActive, player]);

  return (
    <View
      style={{
        width,
        height,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {item.type === "image" ? (
        <Image
          source={{ uri: item.uri }}
          style={{
            width: "100%",
            height: "100%",
            resizeMode: "cover",
          }}
        />
      ) : (
        <VideoView
          style={{ width: "100%", height: "100%" }}
          player={player!}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      )}
    </View>
  );
}
