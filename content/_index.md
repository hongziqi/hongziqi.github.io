---
# Leave the homepage title empty to use the site title
title: ''
date: 2022-10-24
type: landing

sections:
  - block: about.biography
    id: about
    content:
      title: "Me"
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
#  - block: experience
#    content:
#      title: 工作经历
#      # Date format for experience
#      #   Refer to https://docs.hugoblox.com/customization/#date-format
#      date_format: Jan 2006
#      # Experiences.
#      #   Add/remove as many `experience` items below as you like.
#      #   Required fields are `title`, `company`, and `date_start`.
#      #   Leave `date_end` empty if it's your current employer.
#      #   Begin multi-line descriptions with YAML's `|2-` multi-line prefix.
#      items:
#        - title: 软件开发工程师
#          company: 华为
#          company_url: ''
#          company_logo: org-huawei
#          location: 深圳
#          date_start: '2024-04-01'
#          description: |2-
#              主要负责:
#
#              * 昇思MindSpore-开源开发
#        - title: 运维开发工程师
#          company: 360数科
#          company_url: ''
#          company_logo: org-360
#          location: 深圳
#          date_start: '2023-04-03'
#          date_end: '2023-11-01'
#          description: |2-
#              主要负责:
#
#              * 监控平台开发
#              * CMDB平台开发
#              * 自动化运维
#        - title: 运维开发工程师
#          company: ZEGO
#          company_url: ''
#          company_logo: org-zego
#          location: 深圳
#          date_start: '2020-02-20'
#          date_end: '2021-11-01'
#          description: |2-
#              主要负责:
#
#              * Issue报警平台开发
#              * CMDB平台开发
#              * 系统运维
#    design:
#      columns: '2'
  - block: collection
    id: blogs
    content:
      title: 最新分享
      subtitle: ''
      text: ''
      # Choose how many pages you would like to display (0 = all pages)
      count: 5
      # Filter on criteria
      filters:
        folders:
          - blog
        author: ""
        category: ""
        tag: ""
        exclude_featured: true
        exclude_future: false
        exclude_past: false
        publication_type: ""
      # Choose how many pages you would like to offset by
      offset: 0
      # Page order: descending (desc) or ascending (asc) date.
      order: desc
    design:
      # Choose a layout view
      view: compact
      columns: '2'
  - block: tag_cloud
    id: tags
    content:
      title: 内容标签
    design:
      columns: '2'
  - block: contact
    id: contact
    content:
      title: 和我联系
#      subtitle:
#      text: |-
#        欢迎和我取得联系，探讨技术问题。
      # Contact (add or remove contact options as necessary)
      email: 1102229410@qq.com
      address:
        street: 宝安区
        city: 深圳市
        region: 广东省
        postcode: '518000'
#        country: 中国
#        country_code: CN
      # Automatically link email and phone or display as text?
      autolink: true
    design:
      columns: '2'
---
