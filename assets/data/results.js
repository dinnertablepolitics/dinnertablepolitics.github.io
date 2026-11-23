window.RESULTS = 
{
  "generated": "2026-11-23",
  "sample": {
    "observations": 10092,
    "people": 2006,
    "thanksgiving_obs": 606,
    "survey_weeks": 35,
    "index_sd": 1.1312,
    "index_mean": 3.2784
  },
  "paper": {
    "T": -0.123,
    "fam": 0.048,
    "own": -0.004,
    "se_fam": 0.021
  },
  "main": {
    "b": {
      "T": -0.1312,
      "fam": 0.0499,
      "self": -0.0028
    },
    "vcov": [
      [0.0043655, -0.00088265, -0.0001497],
      [-0.00088265, 0.00039874, -0.00014794],
      [-0.0001497, -0.00014794, 0.0002405]
    ]
  },
  "family_distribution": [
    {
      "v": 0,
      "share": 0.0239
    },
    {
      "v": 1,
      "share": 0.0738
    },
    {
      "v": 2,
      "share": 0.179
    },
    {
      "v": 3,
      "share": 0.173
    },
    {
      "v": 4,
      "share": 0.2976
    },
    {
      "v": 5,
      "share": 0.1615
    },
    {
      "v": 6,
      "share": 0.0912
    }
  ],
  "discussion": {
    "Canada": {
      "week": [-2, -1, 0, 1, 2, 3],
      "b": [0.069, 0, 0.0551, 0.0158, -0.048, -0.0896],
      "se": [0.0384, 0, 0.0375, 0.0725, 0.0343, 0.037]
    },
    "Combined": {
      "week": [-2, -1, 0, 1, 2, 3],
      "b": [0.0252, 0, 0.0529, -0.0173, -0.0625, -0.0684],
      "se": [0.0142, 0, 0.0235, 0.025, 0.0182, 0.0288]
    },
    "US": {
      "week": [-2, -1, 0, 1, 2, 3],
      "b": [0.0231, 0, 0.0581, -0.031, -0.0661, -0.0265],
      "se": [0.0133, 0, 0.0278, 0.0216, 0.0154, 0.019]
    }
  },
  "opinion": {
    "Canada": {
      "week": [-2, -1, 0, 1, 2, 3],
      "b": [-0.0412, 0, -0.0204, -0.064, -0.0738, 0.0113],
      "se": [0.0175, 0, 0.0146, 0.0233, 0.0412, 0.0204]
    },
    "Combined": {
      "week": [-2, -1, 0, 1, 2, 3],
      "b": [-0.0041, 0, 0.025, 0.001, -0.0069, -0.0109],
      "se": [0.014, 0, 0.025, 0.0173, 0.0255, 0.0218]
    },
    "US": {
      "week": [-2, -1, 0, 1, 2, 3],
      "b": [0.0021, 0, 0.0412, 0.0136, 0.0147, -0.0164],
      "se": [0.0174, 0, 0.0298, 0.0205, 0.0251, 0.019]
    }
  },
  "robustness": [
    {
      "spec": "Baseline",
      "b": 0.0499,
      "se": 0.02,
      "p": 0.0126,
      "p_wild": 0.0246,
      "n": 10092,
      "ids": 2006,
      "sd_y": 1.1312,
      "b_sd": 0.0441,
      "se_sd": 0.0177,
      "about": "Our replication of the paper's main model"
    },
    {
      "spec": "Simple index",
      "b": 0.015,
      "se": 0.0057,
      "p": 0.0087,
      "p_wild": 0.0506,
      "n": 10092,
      "ids": 2006,
      "sd_y": 0.2972,
      "b_sd": 0.0506,
      "se_sd": 0.0193,
      "about": "Opinion score built without the nearest-neighbour method"
    },
    {
      "spec": "Excl. low-quality",
      "b": 0.0407,
      "se": 0.0209,
      "p": 0.0514,
      "p_wild": 0.0336,
      "n": 9038,
      "ids": 1862,
      "sd_y": 1.1365,
      "b_sd": 0.0358,
      "se_sd": 0.0184,
      "about": "Drops answers that tick the same box for every statement and people sharing an IP address"
    },
    {
      "spec": "Placebo week",
      "b": -0.0016,
      "se": 0.0208,
      "p": 0.9382,
      "p_wild": 0.9348,
      "n": 9460,
      "ids": 1980,
      "sd_y": 1.1299,
      "b_sd": -0.0014,
      "se_sd": 0.0184,
      "about": "Pretends Thanksgiving happened two weeks earlier; should show no effect"
    },
    {
      "spec": "No 2019",
      "b": 0.0511,
      "se": 0.0306,
      "p": 0.0949,
      "p_wild": 0.1618,
      "n": 6668,
      "ids": 1347,
      "sd_y": 1.1312,
      "b_sd": 0.0452,
      "se_sd": 0.0271,
      "about": "Leaves out 2019 (Canadian election, US impeachment hearings)"
    },
    {
      "spec": "No CA 2019",
      "b": 0.0566,
      "se": 0.0213,
      "p": 0.0079,
      "p_wild": 0.0379,
      "n": 9075,
      "ids": 1813,
      "sd_y": 1.1312,
      "b_sd": 0.05,
      "se_sd": 0.0188,
      "about": "Leaves out Canada in 2019"
    },
    {
      "spec": "No US 2019",
      "b": 0.0396,
      "se": 0.0267,
      "p": 0.138,
      "p_wild": 0.1264,
      "n": 7685,
      "ids": 1540,
      "sd_y": 1.1312,
      "b_sd": 0.035,
      "se_sd": 0.0236,
      "about": "Leaves out the US in 2019"
    }
  ],
  "selection": {
    "tg_week": 0.0302,
    "tg_week_se": 0.0332,
    "fam": 0.002,
    "fam_se": 0.0125
  }
}
;
