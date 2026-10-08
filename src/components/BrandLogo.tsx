import logo from "@/assets/arha-market-logo.png.asset.json";

export function BrandLogo({ large = false }: { large?: boolean }) {
  return <span className="flex items-center gap-3">
    <img src={logo.url} alt="Logo Arha Market" width={768} height={768} className={large ? "h-20 w-20 rounded-md object-contain" : "h-12 w-12 rounded-md object-contain"} />
    <span className="flex flex-col text-left">
      <span className="font-display text-lg font-extrabold text-foreground">ARHA <span className="text-primary">MARKET</span></span>
      <span className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Pour elle · Pour lui · Pour tous</span>
    </span>
  </span>;
}