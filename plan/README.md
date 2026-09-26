# plan

実装前のPLANを管理する。

- Current: `plan/head/`
- Historical: `plan/history/`

PLANには目的、根拠、変更対象、非対象、Accuracy、Regression、QA、成功条件を記載する。

同時に置くactive PLANは原則一つ。完了したPLANはhistoryへ移し、通常の
再開scanから外す。
