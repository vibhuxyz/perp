# Session 08: Leverage & Margin Tracking
**Date:** 2026-07-20

## Goal of the Session
Upgrade the Matching Engine from a Spot Exchange to a Perpetual Futures (PERP) Exchange by introducing Leverage and Initial Margin (IM) calculations.

## What We Built
* Added `leverage` to the `Order` and `Fill` interfaces.
* Updated `processOrder` to calculate Initial Margin instead of Notional Value when checking and locking user collateral.
* Passed `order.leverage` down into the `Fill` receipts so the Engine can correctly unlock the scaled margin amount post-trade.

## What I Implemented Myself
* Identified the logic flaw in post-trade settlement where full notional value was being subtracted instead of leveraged margin.
* Refactored the `Fill` interface to track the leverage used for the trade.

## Next Session Plan
* Validate the engine locally by writing a small testing script at the bottom of the file to simulate Alice and Bob trading with leverage.
