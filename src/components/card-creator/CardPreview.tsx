import { CardData } from "./types";
import TypeIcon from "./TypeIcon";
import { typeColors, typePatterns } from "./typeColors";

interface Props {
  data: Partial<CardData>;
}

export default function CardPreview({ data }: Props) {
  const type = data.type || "Normal";
  const color = typeColors[type];
  const pattern = typePatterns[type];

  return (
    <div
      className="w-[400px] h-[560px] rounded-xl p-4 relative transition-all duration-300 mx-auto"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        boxShadow: `0 0 30px ${color}40`,
        maxWidth: "100%",
        aspectRatio: "400/560",
        height: "auto",
      }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-30"
        style={{
          backgroundImage: pattern,
          backgroundSize: type === "Electric" ? "40px 40px" : "cover",
          mixBlendMode: "soft-light",
        }}
      />
      <div
        className="bg-white/95 backdrop-blur-sm rounded-lg h-full flex flex-col relative overflow-hidden"
        style={{
          borderColor: color,
          borderWidth: "2px",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: pattern,
            backgroundSize: type === "Electric" ? "40px 40px" : "cover",
            mixBlendMode: "multiply",
          }}
        />
        <div className="flex items-center justify-between p-3 relative z-10">
          <h2 className="text-xl font-bold" style={{ color: `${color}` }}>
            {data.name || "Pokemon Name"}
          </h2>
          {data.type && (
            <div className="relative">
              <div
                className="absolute inset-0 blur-sm opacity-50"
                style={{ backgroundColor: color }}
              />
              <TypeIcon type={data.type} />
            </div>
          )}
        </div>
        <div
          className="flex-1 flex items-center justify-center overflow-hidden relative"
          style={{
            backgroundColor: `${color}08`,
          }}
        >
          {data.image ? (
            <img
              src={data.image}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 relative z-10">Pokemon Image</span>
          )}
        </div>
      </div>
    </div>
  );
}
