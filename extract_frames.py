#!/usr/bin/env python3
"""
提取视频帧为PNG格式，并移除黑色背景
"""
import os
import cv2
import numpy as np

def extract_frames(video_path, output_dir, max_frames=15):
    """
    提取视频帧
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

    # 提取帧
    frame_count = 0
    current_frame = 0

    while cap.isOpened() and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        # 只处理采样的帧
        if current_frame % frame_interval == 0:
            # 转换为RGBA格式
            frame_rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)

            # 创建黑色背景的mask（检测接近黑色的像素）
            # 将RGB值都小于30的像素视为黑色背景
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

            # 将alpha通道设置为mask（黑色背景变透明）
            frame_rgba[:, :, 3] = mask

            # 保存为PNG
            output_path = os.path.join(output_dir, f"frame_{frame_count:03d}.png")
            cv2.imwrite(output_path, frame_rgba)
            print(f"保存帧 {frame_count + 1}/{max_frames}: {output_path}")

            frame_count += 1

        current_frame += 1

    cap.release()
    print(f"完成！共提取 {frame_count} 帧")

if __name__ == "__main__":
    # 处理run_clean.mp4
    extract_frames(
        "data/run_clean.mp4",
        "data/frames/run",
        max_frames=15
    )

    # 处理dance_clean.mp4
    extract_frames(
        "data/dance_clean.mp4",
        "data/frames/dance",
        max_frames=15
    )

    print("\n✅ 所有视频处理完成！")
    print("帧文件保存在: data/frames/run/ 和 data/frames/dance/")
