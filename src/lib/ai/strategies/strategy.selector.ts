import type { DocumentAnalysis, ProcessOptions } from "@/lib/types";
import { BaseStrategy } from "./base.strategy";
import { TechnicalStrategy } from "./technical.strategy";
import { GeneralStrategy } from "./general.strategy";

// Define concrete strategy classes only
type ConcreteStrategy = typeof GeneralStrategy | typeof TechnicalStrategy;

type StrategyMap = {
  [K in DocumentAnalysis["type"]]?: ConcreteStrategy;
};

export class StrategySelector {
  private strategies: StrategyMap = {
    technical: TechnicalStrategy,
    general: GeneralStrategy,
    legal: GeneralStrategy,
    literature: GeneralStrategy,
    business: GeneralStrategy,
    academic: GeneralStrategy,
  };

  async select(
    analysis: DocumentAnalysis,
    options: ProcessOptions,
  ): Promise<BaseStrategy> {
    // Get concrete strategy class or default to GeneralStrategy
    const StrategyClass = (this.strategies[analysis.type] ||
      GeneralStrategy) as ConcreteStrategy;

    return new StrategyClass({
      tier: options.tier,
      targetLanguage: options.targetLanguage,
      preserveFormatting: options.preserveFormatting,
      analysis,
    });
  }
}
