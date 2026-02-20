#!/usr/bin/env python3
"""
处理兔子视频：提取帧并去除背景
"""
import os
import cv2
from PIL import Image
from rembg import remove
import numpy as np

def process_video(video_path, output_dir, max_frames=15):
    """
    处理视频：提取帧并去除背景
    """
    print(f"\n处理视频: {video_path}")

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 打开视频
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"无法打开视频: {video_path}")
        return

    # 获取视频信息
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    print(f"总帧数: {total_frames}, FPS: {fps}")

    # 计算采样间隔
    frame_interval = max(1, total_frames // max_frames)
    print(f"采样间隔: {frame_interval}")

    # 提取并处理帧
    frame_count = 0
    current_frame = 0

    while cap.isOpened() and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        # 只处理采样的帧
        if current_frame % frame_interval == 0:
            # 转换BGR到RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # 转换为PIL Image
            img = Image.fromarray(frame_rgb)

            # 去除背景
            print(f"处理帧 {frame_count + 1}/{max_frames}...", end='\r')
            img_no_bg = remove(img)

            # 保存为PNG（支持透明背景）
            output_path = os.path.join(output_dir, f"frame_{frame_count:03d}.png")
            img_no_bg.save(output_path)

            frame_count += 1

        current_frame += 1

    cap.release()
    print(f"\n完成！共处理 {frame_count} 帧")

if __name__ == "__main__":
    # 处理run.mp4
    process_video(
        "data/run.mp4",
        "data/frames/run",
        max_frames=15
    )

    # 处理dance.mp4
    process_video(
        "data/dance.mp4",
        "data/frames/dance",
        max_frames=15
    )

    print("\n✅ 所有视频处理完成！")
    print("帧文件保存在: data/frames/run/ 和 data/frames/dance/")
