import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ImageIcon, LinkIcon, Loader2, History } from "lucide-react";
import { uploadImage } from "@/lib/storage";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

interface Props {
  onImageSelect: (imageUrl: string) => void;
}

interface StoredGeneration {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
}

export default function ImageUploader({ onImageSelect }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previousGenerations, setPreviousGenerations] = useState<StoredGeneration[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreviousGenerations();
    }
  }, [user]);

  const loadPreviousGenerations = async () => {
    if (!user) return;

    try {
      const generationsRef = collection(db, "cardGeneration");
      const q = query(
        generationsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const generations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl,
        prompt: doc.data().prompt,
        createdAt: doc.data().createdAt.toDate()
      })) as StoredGeneration[];
      
      setPreviousGenerations(generations);
    } catch (error) {
      console.error("Error loading previous generations:", error);
      toast({
        title: "Error",
        description: "Failed to load previous generations",
        variant: "destructive",
      });
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl) {
      onImageSelect(imageUrl);
      setImageUrl("");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF)",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const downloadUrl = await uploadImage(file);
      onImageSelect(downloadUrl);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* File Upload Section */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 lg:p-6 transition-colors min-h-[120px] flex items-center justify-center ${
          dragActive
            ? "border-yellow-400 bg-yellow-400/5"
            : "border-gray-700 hover:border-gray-600"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <div className="text-center">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-300 mb-1">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-300 mb-1">
                <span className="hidden sm:inline">
                  Drag and drop your image here, or{" "}
                </span>
                <span>click to select</span>
              </p>
              <p className="text-xs text-gray-500">Supports: JPG, PNG, GIF</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-gray-500">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* URL Input Section */}
      <form onSubmit={handleUrlSubmit} className="space-y-2">
        <Label htmlFor="imageUrl" className="text-white text-sm">
          Image URL
        </Label>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Input
            id="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
            disabled={uploading}
          />
          <Button
            type="submit"
            variant="secondary"
            className="bg-white/5 text-white hover:bg-white/10 w-full sm:w-auto"
            disabled={uploading || !imageUrl}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Add
          </Button>
          <Button
            variant="outline"
            className="bg-white/5 border-gray-700 text-white hover:bg-white/10"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {showHistory && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Previous Generations</h3>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowHistory(false)}
            >
              Close
            </Button>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {previousGenerations.map((gen) => (
              <div
                key={gen.id}
                className="border border-gray-700 rounded-lg p-4 space-y-2 cursor-pointer hover:bg-white/5"
                onClick={() => onImageSelect(gen.imageUrl)}
              >
                <img
                  src={gen.imageUrl}
                  alt={gen.prompt}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-400">{gen.prompt}</p>
                <p className="text-xs text-gray-500">
                  {gen.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))}
            {previousGenerations.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                No previous generations found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
