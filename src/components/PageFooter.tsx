export default function PageFooter() {
  return (
    <div className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-vault-border/30 text-center">
      <p className="text-xs md:text-body-sm font-display font-semibold text-vault-text tracking-wide">ArcVault</p>
      <p className="text-[10px] md:text-xs text-vault-muted mt-1.5">
        A personal cinema journey, crafted by <span className="text-vault-text-secondary font-medium">DAX SANANDIYA</span>
      </p>
      <p className="text-[9px] md:text-[10px] text-vault-muted/60 mt-2">
        © 2026 DAX SANANDIYA · v1.0.0
      </p>
    </div>
  );
}