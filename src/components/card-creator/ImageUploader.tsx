import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ImageIcon, LinkIcon, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/storage";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  onImageSelect: (imageUrl: string) => void;
}

export default function ImageUploader({ onImageSelect }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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
        </div>
      </form>
    </div>
  );
}
